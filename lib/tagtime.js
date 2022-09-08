var botils = require('./botils.js')
var https  = require('https')
var rkey = botils.keyfn("tagtime")

if (process.env.REDIS_URL) {
  //var rtg   = require("url").parse(process.env.REDIS_URL)
  var redis = require("redis").createClient({
    url: process.env.REDIS_URL,
    socket: {
      tls: true,
      rejectUnauthorized: false,
    }
  })
  //redis.auth(rtg.auth.split(":")[1])
} else {
  var redis = require("redis").createClient()
}

var help = function(res) {
  botils.whisp(res, "How to use /tagtime\n"
  + "`/tagtime on` receive pings via DM from @beebot\n"
  + "`/tagtime off` turn off pings via DM\n"
  + "`/tagtime help` show this message")
}

var handleSlash = function(req, res) {
  var team_id = req.body.team_id
  var user_id = req.body.user_id
  var user    = req.body.user_name
  var text    = req.body.text

  if (text === "on") {
    redis.sadd(rkey(), team_id + "-" + user, function(err, obj) {
      botils.whisp(res, "TagTime is now watching you!");
    });
  } else if (text === "off") {
    redis.srem(rkey(), team_id + "-" + user, function(err, obj) {
      botils.whisp(res, "TagTime is no longer watching you!")
    })
  } else {
    help(res)
  }
}

var handlePing = function(req, res) {
  var beebot = require('./beebot.js')
  redis.smembers(rkey(), function(err, obj) {
    obj.forEach(function(key) {
      var team = key.split("-")[0]
      var rtm = beebot.rtmForTeam(team)
      var dm = rtm.dataStore.getDMByName(key.split("-")[1])
      rtm.sendMessage("Ping! What are you doing *right now*?", dm.id)
    })
  })
}

module.exports = {
  handleSlash: handleSlash,
  handlePing: handlePing,
}
