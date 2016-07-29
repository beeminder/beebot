var botils = require('./botils.js');
var https  = require('https');

if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var redis = require("redis").createClient(rtg.port, rtg.hostname);
  redis.auth(rtg.auth.split(":")[1]);
} else {
  var redis = require("redis").createClient();
}

var help = function(res) {
  // whisper the documentation
  botils.whisp(res, "How to use /tagtime\n"
  + "`/tagtime on` receive pings via DM from Beebot\n"
  + "`/tagtime off` turn of pings via DM\n"
  + "`/tagtime help` show this message");
}

var handleSlash = function(req, res) {
  var team_id = req.body.team_id
  var user_id = req.body.user_id
  var user    = req.body.user_name
  var text    = req.body.text

  if (text === "on") {
    redis.sadd("beebot.tagtime", team_id + "-" + user, function(err, obj) {
      botils.whisp(res, "TagTime is now watching you!");
    });
  } else if (text === "off") {
    redis.srem("beebot.tagtime", team_id + "-" + user, function(err, obj) {
      botils.whisp(res, "TagTime is no longer watching you!");
    });
  } else {
    help(res);
  }
}

var handlePing = function(req, res) {
  var beebot = require('./beebot.js');
  redis.smembers("beebot.tagtime", function(err, obj) {
    obj.forEach(function(key) {
      var team = key.split("-")[0];
      var rtm = beebot.rtmForTeam(team);
      var dm = rtm.dataStore.getDMByName(key.split("-")[1]);
      rtm.sendMessage("Ping! What are you doing *right now*?", dm.id);
    })
  })
}

module.exports = {
  handleSlash: handleSlash,
  handleMessage: handlePing
}
