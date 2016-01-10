// https://slack.com/oauth/authorize?scope=identify,incoming-webhook,commands,bot&client_id=14536485331.17569015415
require('dotenv').load();
if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var redis = require("redis").createClient(rtg.port, rtg.hostname);
  redis.auth(rtg.auth.split(":")[1]);
} else {
    var redis = require("redis").createClient();
}

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var url = require('url');
var request = require('request');
var slackClient = require('slack-client');

var bots = []; // yikes

var handleMessage = function(rtm, message) {
  redis.keys("beebot.userid." + message.user, function(err, obj) {
    if (obj) {
      if (obj.account_reply) {

      }
      else {
        redis.hmset("beebot.userid." + message.user, { account_reply: true });
        var replyText = "Okay - you can sign up for one here: https://www.beeminder.com";
        if (message.text.match(/y/)) {
          replyText = "Great. Log in to Beeminder (if you're not already), and then link your Beeminder account to Slack here: https://www.beeminder.com/slack_auth";
        }
        rtm.send({
          id: 1,
          type: "message",
          channel: message.channel,
          text: replyText
        });
      }
    }
    else {
      redis.hmset("beebot.userid." + message.user, {});
      rtm.send({
        id: 1,
        type: "message",
        channel: message.channel,
        text: "Hey, nice to meet you. Do you already have a Beeminder account?"
      });
    }
  });
};

var startBot = function(teamId) {
  var credentials = redis.hgetall("beebot.teamid." + teamId, function(err, obj) {
    var WebClient = slackClient.WebClient;
    var RtmClient = slackClient.RtmClient;
    var webClient = new WebClient(obj.bot_access_token);
    var rtm = new RtmClient(webClient, {logLevel: 'debug'});

    rtm.on('message', function(message) {
        if (message.channel.match(/^D/)) {
          handleMessage(rtm, message);
        }
    });

    rtm.start();
    bots.push(rtm);
  })
};

app.set('port', (process.env.PORT || 5000));

app.post('/bot', function(req, res) {
  redis.hmset("beebot.teamid." + req.body.team_id, { bot_access_token: req.body.bot_access_token }, function(err, obj) {
    startBot(req.body.team_id);
    res.send("OK");
  });
});

app.delete('/bot', function(req, res) {
  // delete a bot, if a user deauths from a team.
  // basically just need to delete the team id from redis so we don't keep trying to create it on restarts
});

app.post('/zeno', function(req, res) {
  // expects team+user ID, goal ID, deadline, bare min.

  // should look up the rtm bot that has the user on its team and post a DM.
});

app.get('/debugger', function(req, res) {
  debugger;
});

app.post('/roll', function(req, res) {
  var text = req.body.text;
  res.send(req.body);
  return;
  if (text.match(/^[0-9]+$/) == null) {
    res.send("Not an integer! Try again...")
  } else {
    res.send("Rolling a " + text + "-sided die... it came up " + Math.floor(Math.random() * (text - 0)) + 1);
  }
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
  redis.keys("beebot.teamid.*", function(err, obj) {
    for (var i = 0; i < obj.length; i++) {
      var teamId = obj[i].split(".").pop();
      console.log(teamId);
      startBot(teamId);
    }
  });
});
