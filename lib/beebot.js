// --------------------------------- 80chars ---------------------------------->
const botils = require('./botils.js')

if (process.env.REDIS_URL) {
  //var rtg   = require("url").parse(process.env.REDIS_URL)
  var redis = require("redis").createClient({
    url: process.env.REDIS_URL,
    tls: {
      rejectUnauthorized: false,
    }
  })
  //redis.auth(rtg.auth.split(":")[1])
} else {
  var redis = require("redis").createClient()
}

var https = require('https')
var karmabot = require('./karma.js')
//console.log(`DEBUG3: karmabot = ${JSON.stringify(karmabot)}`)
var bots = []

// handle a message and pass it through to the Beeminder server
var handleMessage = function(rtm, message) {
  console.log("handleMessage", message)
  // I hope this is safe: the bot was responding to its own
  // messages when i use chat.message.. which is no good,
  // so skip if it has a subtype of "bot_message"? again, no
  // idea if this is safe, but it does work in the instance of
  // the DM zenoing
  if (message.subtype === "bot_message") return
  var text = message.text
  var regexpString = "<@" + rtm.activeUserId + ">"
  if (message.text.match(new RegExp(regexpString))) {
    // remove the @-mention of the bot from the message
    var tokenized = message.text.split(/\s/)
    tokenized = tokenized.filter((e) => {
      return !e.match(new RegExp(regexpString))
    })
    text = tokenized.join(" ")
  }
  https.get("https://www.beeminder.com/slackbot?command="
    + encodeURIComponent(text) + "&team_id=" + message.team
                               + "&user_id=" + message.user,
    function(res) {
      var resText = ''
      res.on("data", (chunk) => { resText += chunk })
      res.on("end", () => {
        rtm.send({ id: 1,
                   type: "message",
                   channel: message.channel,
                   text: resText,
                 })
      })
    }).on('error', (e) => { console.error(e) })
}

var stopBot = function(teamId) {
  bots.forEach(function(rtm) {
    if (rtm.teamId === teamId) { rtm.disconnect() }
  })
}

var startBot = function(teamId, rurl=null) {
  var rediskey = `beebot.teamid.${teamId}`
  redis.hgetall(rediskey, function(err, obj) {
    try {
      //console.log("DEBUG: obj and err are both null!")
      //console.log("DEBUG: teamId/obj/err", teamId, obj, err)
      const RtmClient       = require('@slack/client').RtmClient
      const CLIENT_EVENTS   = require('@slack/client').CLIENT_EVENTS
      const MemoryDataStore = require('@slack/client').MemoryDataStore

      if (obj === null && rurl !== null) {
        botils.blurt(rurl, "Sad panda. Can't create a bot to listen here. " +
          `redis.hgetall("beebot.teamid.${teamId}") returned null ` +
          "so we can't look up the bot access token for the Slack RTM client.")
        return
      }
      const logLevel = 'info'
      const rtm = new RtmClient(obj.bot_access_token, {
        useRtmConnect: true,
        dataStore: new MemoryDataStore(),
        autoReconnect: true,
        logLevel: logLevel,
        logger: (level, msg) => {
          if (logLevel == level) { 
            console.log("RTM LOG", level, msg)
          } 
          return 
        },
      })

      rtm.on('message', function(message) {
        if (!message.text) { return }
        var regexpString = "<@" + rtm.activeUserId + ">"
        if (message.text.match(new RegExp(regexpString))) {
          handleMessage(rtm, message)
        }
        if (message.channel.match(/^D/) && message.team && !message.command) {
          handleMessage(rtm, message)
        }
        if (message.text.match(new RegExp(/\+\+|--/))) {
          console.log('spotted a ++')
          karmabot.handleMessage(rtm, message)
        }
      })

      rtm.on('error', (error) => {
        //console.log("mysterycrashererror")
        console.error("ERROR", error.msg)
      })

      rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function(rtmStartData) {
        //console.log("AUTHENTICATED!", rtmStartData.self.name, rtmStartData.team.name)
        rtm.userId = rtmStartData.self.id
      })
      rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {
        //console.log("CONNEXTION READY?")
        //console.log("RTM is CONNECTED?", rtm.connected)
      })
      rtm.on(CLIENT_EVENTS.RTM.DISCONNECT, () => {
        //console.log("RTM is DISCONNECTED?", !rtm.connected)
      })
      rtm.on(CLIENT_EVENTS.RTM.UNABLE_TO_RTM_START, (error) => {
        // could not start the connection with slack
        if (error.message === "account_inactive" ||
            error.message === "invalid_auth") {
          // delete the bot
          redis.del(rediskey, function(err, obj) {
            console.log("redis delete callback", err, obj)
          })
        } 
        console.error("UNABLE_TO_RTM_START", error.message)
      })
      rtm.on(CLIENT_EVENTS.RTM.WS_ERROR, (error) => {
        console.error("WS_ERROR", error)
      })
      rtm.on(CLIENT_EVENTS.WEB.RATE_LIMITED, (error) => {
        console.error("WEB RATE LIMITED", error)
      })
      rtm.on('Ratelimited', (error) => {
        console.error("RATE LIMITED", error)
      })

      stopBot(teamId)
      rtm.start()
      rtm.teamId = teamId
      bots.push(rtm)
    } catch (error) {
      console.error("caught error creating rtm client", error)
      console.error(error.message)
      return
    }

  })
}

var handleCreateBot = function(req, resp) {
  redis.hmset("beebot.teamid." + req.body.team_id,
              { bot_access_token: req.body.bot_access_token },
              function(err, obj) {
                startBot(req.body.team_id)
                resp.send("OK")
              }
  )
}

var handleZeno = (req, res) => {
  //var rtm = bots.filter((b) => { return b.teamId === req.body.team_id })[0]
  var rtm = rtmForTeam(req.body.team_id) 
  if (rtm === undefined || rtm === null) { 
    console.error("no rtm for team " + req.body.team_id)
    res.status(500).send('no rtm for team team_id'); return 
  }
  if (rtm.connected === false) {
    console.error("rtm not connected")
    rtm.start()
  }
  var WebClient = require('@slack/client').WebClient
  var webClient = new WebClient(rtm._token)

  if (req.body.channel) {
    try {
      webClient.conversations.list({}, (error, response) => {
        if (!response.ok) { 
          console.error("error in conversations.list: " + response)
          console.error("DEBUG1: error: ", error)
          res.send("error!"); return 
        } //TODO: alert
        for (var i = 0; i < response.channels.length; i++) {
          var channel = response.channels[i]
          if (channel.name !== req.body.channel.replace('#', '')) { continue }
          webClient.chat.postMessage(channel.id, req.body.message)
          res.send("ok"); return
        }
        res.status(404).send("could not find a channel with the name " + req.body.channel); return
      })
    } catch (error) {
      console.error("error in conversations.list: " + error.message)
      res.status(500).send("error in handleZeno: " + error.message); return
    }
    return
  }

  // else default to a DM
  // TODO: when would we have a user here? I don't understand this 
  var user = rtm.dataStore.getUserById(req.body.user_id)
  try {
    if (user) {
      var dm = rtm.dataStore.getDMByName(user.name)
      if (dm) {
        rtm.sendMessage(req.body.message, dm.id)
        res.send("ok")
        return
      }
    }
  } catch (error) {
    console.error("error in datastore user: " + error.message)
    res.status(500).send("error in handleZeno: " + error.message)
    return
  }

  // open the dm channel if we didn't find a user
  try {
    webClient.conversations.open({token: rtm._token, users: req.body.user_id}, 
      (error, response) => {
        if (error !== undefined) {
          console.log("DM ERROR:", error)
        }
        if (!response.ok) {
          console.log("DM RESP NOT OK:", response)
        }
        webClient.chat.postMessage(response.channel.id, req.body.message)
        res.send("ok"); return
      }
    )
  } catch (error) {
    console.error("error in webClient conversations.open: " + error.message)
    res.status(500).send("error in handleZeno: " + error.message)
    return
  }

  res.send("ok")
  return
}

var rtmForTeam = (teamId) => {
  return bots.filter((b) => { return b.teamId === teamId })[0]
}

module.exports = {
  startBot:        startBot,
  handleCreateBot: handleCreateBot,
  handleZeno:      handleZeno,
  rtmForTeam:      rtmForTeam,
}
