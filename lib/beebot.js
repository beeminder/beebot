// --------------------------------- 80chars ---------------------------------->
var botils = require('./botils.js')

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
  //console.log("DEBUG4: handleMessage", message)
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
    //console.log("DEBUG: obj and err are both null!")
    //console.log(`DEBUG: teamId/obj/err = ${teamId} / ${obj} / ${err}`)
    console.log("DEBUG: teamId/obj/err", teamId, obj, err)
    const RtmClient       = require('@slack/client').RtmClient
    const CLIENT_EVENTS   = require('@slack/client').CLIENT_EVENTS
    const MemoryDataStore = require('@slack/client').MemoryDataStore
    if (obj === null && rurl !== null) {
      botils.blurt(rurl, "Sad panda. Can't create a bot to listen here. " +
        `redis.hgetall("beebot.teamid.${teamId}") returned null ` +
        "so we can't look up the bot access token for the Slack RTM client.")
      return
    }
    const rtm = new RtmClient(obj.bot_access_token, {
      useRtmConnect: true,
      dataStore: new MemoryDataStore(),
      autoReconnect: true,
    })
    // RtmClient constructor appears to be broken, not storing the token that
    // is passed in the constructor, but expecting it to be around 
    rtm.token = obj.bot_access_token

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
      console.log(error)
      console.log(typeof(error))
      console.log("mysterycrashererror")
    })

    rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function(rtmStartData) {
      //console.log("AUTHENTICATED!", Object.keys(rtmStartData))
      rtm.userId = rtmStartData.self.id
    })
    rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {
      //console.log("CONNEXTION READY?")
      console.log("RTM is CONNECTED?", rtm.connected)
    })

    stopBot(teamId)
    rtm.start()
    rtm.teamId = teamId
    bots.push(rtm)
  })
}

var handleCreateBot = function(req, resp) {
  //console.log(`DEBUG5: req = ${JSON.stringify(req)}`)
  redis.hmset("beebot.teamid." + req.body.team_id,
              { bot_access_token: req.body.bot_access_token },
              function(err, obj) {
                //console.log("DEBUG2")
                startBot(req.body.team_id)
                resp.send("OK")
              }
  )
}

var handleZeno = (req, res) => {
  console.log("handleZeno")
  //var rtm = bots.filter((b) => { return b.teamId === req.body.team_id })[0]
  var rtm = rtmForTeam(req.body.team_id) 
  if (rtm === undefined || rtm === null) { 
    console.log("no rtm for team " + req.body.team_id)
    res.send("500"); return 
  }
  console.log(`rtm found: attempts:${rtm._connAttempts}, connected:${rtm.connected}, token:${rtm._token}`)
  var WebClient = require('@slack/client').WebClient
  var webClient = new WebClient(rtm._token)
  console.log(`webClient created: token:${webClient.token}`)

  if (req.body.channel) {
    console.log(`req.body.channel = ${req.body.channel}`)
    webClient.conversations.list({}, (error, response) => {
      if (!response.ok) { 
        res.send("error!") 
        console.log("error in conversations.list: " + response.error)
        return 
      } //TODO: alert
      console.log(`got ${response.channels.length} channels`)
      for (var i = 0; i < response.channels.length; i++) {
        var channel = response.channels[i]
        if (channel.name !== req.body.channel.replace('#', '')) { continue }
        console.log(`found channel ${channel.name} (${channel.id})`)
        webClient.chat.postMessage(channel.id, req.body.message)
        console.log(`sent message`)
        //rtm.sendMessage(req.body.message, channel.id)
        res.send("ok")
        return
      }
      console.log(`could not find channel ${req.body.channel}`)
      res.send("could not find a channel with the name " + req.body.channel)
    })
    return
  }

  // else default to a DM
  // TODO: when would we have a user here? I don't understand this 
  var user = rtm.dataStore.getUserById(req.body.user_id)
  console.log("datastore user", user)
  if (user) {
    console.log("looking up user DM in datatstore")
    var dm = rtm.dataStore.getDMByName(user.name)
    console.log("looked up user DM in datatstore")
    if (dm) {
    console.log("found user DM in datatstore")
      rtm.sendMessage(req.body.message, dm.id)
    console.log("sent message")
      res.send("ok")
      return
    }
  }

  // open the dm channel if we didn't find a user
  //webClient.conversations.open(_token, (error, response) => {
  console.log("opening webClient conversations: ")
  webClient.conversations.open({token: rtm._token, users: req.body.user_id}, 
    (error, response) => {
      console.log("webClient conversations.open callback: ", error, response)
    webClient.chat.postMessage(response.channel.id, req.body.message)
    console.log("posted message")
    //rtm.sendMessage(req.body.message, response.channel.id)
    return
  })

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
