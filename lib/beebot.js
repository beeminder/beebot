// --------------------------------- 80chars ---------------------------------->
var botils = require('./botils.js')

if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL)
  var redis = require("redis").createClient(rtg.port, rtg.hostname)
  redis.auth(rtg.auth.split(":")[1])
} else {
  var redis = require("redis").createClient()
}

var https = require('https')
var karmabot = require('./karma.js')
console.log(`DEBUG3: karmabot = ${JSON.stringify(karmabot)}`)
var bots = []

// handle a message and pass it through to the Beeminder server
var handleMessage = function(rtm, message) {
  console.log(`DEBUG4: handleMessage ${message.text}`)
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
  redis.hgetall("beebot.teamid." + teamId, function(err, obj) {
    console.log("DEBUG: obj and err are both null!")
    console.log(`DEBUG: teamId/obj/err = ${teamId} / ${obj} / ${err}`)
    var RtmClient = require('@slack/client').RtmClient
    var MemoryDataStore = require('@slack/client').MemoryDataStore
    if (obj === null && rurl !== null) {
      botils.blurt(rurl, "Sad panda. Can't create a bot to listen here. " +
        `redis.hgetall("beebot.teamid.${teamId}") returned null ` +
        "so we can't look up the bot access token for the Slack RTM client.")
      return
    }
    var rtm = new RtmClient(obj.bot_access_token, {
      dataStore: new MemoryDataStore(),
      autoReconnect: true,
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
      console.log(error)
      console.log(typeof(error))
      console.log("mysterycrashererror")
    })

    var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS

    rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function(rtmStartData) {
      rtm.userId = rtmStartData.self.id
    })

    stopBot(teamId)
    rtm.start()
    rtm.teamId = teamId
    bots.push(rtm)
  })
}

var handleCreateBot = function(req, resp) {
  console.log(`DEBUG5: req = ${JSON.stringify(req)}`)
  redis.hmset("beebot.teamid." + req.body.team_id,
              { bot_access_token: req.body.bot_access_token },
              function(err, obj) {
                console.log("DEBUG2")
                startBot(req.body.team_id)
                resp.send("OK")
              }
  )
}

var handleZeno = (req, res) => {
  var rtm = bots.filter((b) => { return b.teamId === req.body.team_id })[0]
  if (rtm === null) { res.send("500"); return }
  var WebClient = require('@slack/client').WebClient
  var webClient = new WebClient(rtm._token)

  if (req.body.channel) {
    webClient.channels.list({}, (error, response) => {
      if (!response.ok) { res.send("error!"); return } //TODO: alert
      for (var i = 0; i < response.channels.length; i++) {
        var channel = response.channels[i]
        if (channel.name !== req.body.channel.replace('#', '')) { continue }
        rtm.send({ id      : 1,
                   type    : "message",
                   channel : channel.id,
                   text    : req.body.message })
        res.send("ok")
        return
      }
      res.send("could not find a channel with the name " + req.body.channel)
    })
    return
  }

  // else default to a DM
  var user = rtm.dataStore.getUserById(req.body.user_id)
  if (user) {
    var dm = rtm.dataStore.getDMByName(user.name)
    if (dm) {
      rtm.sendMessage(req.body.message, dm.id)
      res.send("ok")
      return
    }
  }

  // open the dm channel if we didn't find a user
  webClient.dm.open(req.body.user_id, (error, response) => {
    rtm.sendMessage(req.body.message, response.channel.id)
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
