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
var https = require('https');
var http = require('http');

var bots = []; // yikes

var handleMessage = function(rtm, message) {
  https.get("https://www.beeminder.com/slackbot?command=" + encodeURIComponent(message.text) + "&team_id=" + message.team + "&user_id=" + message.user, function(res) {
    var text = '';
    res.on("data", function(chunk) {
      text += chunk;
    });

    res.on("end", function() {
      rtm.send({
        id: 1,
        type: "message",
        channel: message.channel,
        text: text
      });
    });
  }).on('error', (e) => {
    console.error(e);
  });
};

var startBot = function(teamId) {
  redis.hgetall("beebot.teamid." + teamId, function(err, obj) {
    var RtmClient = require('@slack/client').RtmClient;
    var rtm = new RtmClient(obj.bot_access_token, {logLevel: 'debug'});

    rtm.on('message', function(message) {
        if (message.channel.match(/^D/)) {
          handleMessage(rtm, message);
        }
    });

    rtm.on('error', function(bot) {
      bot.disconnect();
    });

    rtm.start();
    rtm.teamId = teamId;
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
  var rtm = bots.filter(function(b) { return b.teamId == req.body.team_id; })[0];
  if (rtm == null) { res.send("500"); return; }

  var WebClient = slackClient.WebClient;
  var webClient = new WebClient(rtm._webClient._token);

  if (req.body.channel) {
    webClient.channels.list({}, function(error, response) {
      if (!response.ok) { res.send("error!"); return; } //TODO: alert
      for (var i = 0; i < response.channels.length; i++) {
        var channel = response.channels[i];
        if (channel.name != req.body.channel.replace('#', '')) { continue; }
        rtm.send({
          id: 1,
          type: "message",
          channel: channel.id,
          text: req.body.message
        });
        res.send("ok");
        return;
      }
      res.send("could not find a channel with the name " + req.body.channel);
    });
    return;
  }

  // else default to a DM
  webClient.dm.open(req.body.user_id, function(error, response) {
    if (!response.ok) { res.send("error!"); return; } //TODO: alert
    rtm.send({
      id: 1,
      type: "message",
      channel: response.channel.id,
      text: req.body.message
    });
    res.send("ok");
  });
});

app.get('/debugger', function(req, res) {
  debugger;
});

app.post('/roll', function(req, res) {
  var text = req.body.text;
  if (text.match(/^[0-9]+$/) == null) {
    res.send("Not an integer! Try again...");
  } else {
    res.send({
      "response_type": "in_channel",
      "text": "Rolling a " + text + "-sided die... it came up " + (Math.floor(Math.random() * (text - 0)) + 1)
    });
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
