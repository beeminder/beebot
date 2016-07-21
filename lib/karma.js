var botils = require('./botils.js');
var https  = require('https');

if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var redis = require("redis").createClient(rtg.port, rtg.hostname);
  redis.auth(rtg.auth.split(":")[1]);
} else {
  var redis = require("redis").createClient();
}

var handleMessage = function(rtm, message) {
  redis.get("beebot.karmabot." + message.team + ".on", function(err, obj) {
    if (obj && !err) {
      var regex = /(\S+)(\+\+|--)/g;
      var match = null;
      console.log(message.text);
      console.log(message.attachments);
      while ((match = regex.exec(message.text)) != null)
      {
        var matchname = match[1];
        if (match[2] === "++") {
          redis.zincrby("beebot.karmabot." + message.team, 1, matchname,
          function(err, obj) {
            rtm.send({
              id: 1,
              type: "message",
              channel: message.channel,
              text: matchname + " has " + obj + " karma"
            });
          })
        } else if (match[2] === "--") {
          redis.zincrby("beebot.karmabot." + message.team, -1, matchname,
          function(err, obj) {
            rtm.send({
              id: 1,
              type: "message",
              channel: message.channel,
              text: matchname + " has " + obj + " karma"
            });
          })
        }
      }
    }
  });
}

var help = function(res) {
  // whisper the documentation
  botils.whisp(res, "How to use /karma\n"
  + "`/karma on` turn karmabot on for this team\n"
  + "`/karma off` turn karmabot off for this team. Saves stored karma\n"
  + "`/karma reset` turn karmabot off for this team. Removes stored karma!\n"
  + "`/karma list` publicly show all karma scores\n"
  + "`/karma list N` publicly show the top `N` karma scores\n"
  + "`/karma help` show this message");
}

var handleSlash = function(req, res) {
  var beebot = require('./beebot.js');
  if(req.body.token != process.env.SLACK_TOKEN) {
    botils.whisp(res, "This request didn't come from Slack!");
    return;
  }
  var team_id = req.body.team_id
  var user_id = req.body.user_id
  var user    = req.body.user_name
  var text    = req.body.text

  if (text === "on") {
    redis.set("beebot.karmabot." + team_id + ".on", 1, function(err, obj) {
      botils.shout(res, "now tracking karma");
      beebot.startBot(team_id);
    });
  } else if (text === "off") {
    redis.del("beebot.karmabot." + team_id + ".on", function(err, obj) {
      botils.shout(res, "stopped tracking karma");
      beebot.startBot(team_id);
    });
  } else if (text === "reset") {
    redis.del("beebot.karmabot." + team_id + ".on", function(err, obj) {
      if (!err) {
        redis.del("beebot.karmabot." + team_id, function(err, obj) {
          if (!err) {
            botils.shout(res, "reset the karma table and stopped tracking.");
            beebot.startBot(team_id);
          } else {
            botils.shout(res,"something went wrong when trying to reset karma");
          }
        });
      } else {
        botils.shout(res, "something went wrong when trying to reset karma");
      }
    });
  } else if (text.match(/^list/)) {
    var n = text.split(/\s/)[1];
    if (!n || isNaN(parseInt(n))) {
      n = -1 // if N is not specified, return all scores
    }
    redis.zrevrange("beebot.karmabot." + team_id, 0, n, "WITHSCORES",
    function(obj, err) {
      if (!err) {
        if (obj.length === 0) {
          botils.shout(res, "No karma yet! Try `karmabot++`?");
          return;
        }
        var message = "";
        obj.forEach(function(e, i) {
          // alternately join array with ":" and "\n", e.g. "apb: 5\n bee: 2\n"
          message += (i % 2 === 0) ? ": " : "\n";
        });
        botils.shout(res, message);
      } else {
        botils.whisp(res, "something went wrong trying to retrieve karma");
      }
    });
  } else {
    help(res);
  }
}

module.exports = {
  handleSlash: handleSlash,
  handleMessage: handleMessage
}
