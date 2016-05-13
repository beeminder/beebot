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
var https = require('https');
var http = require('http');

var bots = []; // yikes

var handleMessage = function(rtm, message) {
  var text = message.text;
  var regexpString = "<@" + rtm.activeUserId + ">";
  if (message.text.match(new RegExp(regexpString))) {
    // remove the @-mention of the bot from the message
    var tokenized = message.text.split(/\s/);
    tokenized = tokenized.filter(function(e) {
      return !e.match(new RegExp(regexpString)) });
    text = tokenized.join(" ");
  }
  https.get("https://www.beeminder.com/slackbot?command="
    + encodeURIComponent(text) + "&team_id="
    + message.team + "&user_id=" + message.user,
    function(res) {
      var resText = '';
      res.on("data", function(chunk) { resText += chunk; });

      res.on("end", function() {
        rtm.send({
          id: 1,
          type: "message",
          channel: message.channel,
          text: resText
        });
      });
    }).on('error', (e) => { console.error(e); });
};

var stopBot = function(teamId) {
  bots.forEach(function(rtm) {
    if (rtm.teamId === teamId) { rtm.disconnect(); }
  });
};

var startBot = function(teamId) {
  redis.hgetall("beebot.teamid." + teamId, function(err, obj) {
    var RtmClient = require('@slack/client').RtmClient;
    var MemoryDataStore = require('@slack/client').MemoryDataStore;
    var rtm = new RtmClient(obj.bot_access_token, {
      logLevel: 'debug',
      dataStore: new MemoryDataStore(),
      autoReconnect: true,
    });

    rtm.on('message', function(message) {
      if (!message.text) { return; }
      var regexpString = "<@" + rtm.activeUserId + ">";
      if (message.text.match(new RegExp(regexpString))) {
        handleMessage(rtm, message);
      }
      if (message.channel.match(/^D/) && message.team) {
        handleMessage(rtm, message);
      }
    });

    rtm.on('error', function(bot) { bot.disconnect(); });

    var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

    rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
      rtm.userId = rtmStartData.self.id;
    });

    stopBot(teamId);
    rtm.start();
    rtm.teamId = teamId;
    bots.push(rtm);
  })
};

app.set('port', (process.env.PORT || 5000));

app.post('/bot', function(req, res) {
  redis.hmset("beebot.teamid." + req.body.team_id,
    { bot_access_token: req.body.bot_access_token },
    function(err, obj) {
      startBot(req.body.team_id);
      res.send("OK");
    }
  );
});

app.delete('/bot', function(req, res) {
  // delete a bot, if a user deauths from a team.
  // basically just need to delete the teamId from redis so we don't keep trying
  // to create it on restarts
});

app.post('/zeno', function(req, res) {
  var rtm = bots.filter(function(b) {
    return b.teamId === req.body.team_id; })[0];
  if (rtm === null) { res.send("500"); return; }
  var WebClient = require('@slack/client').WebClient;
  var webClient = new WebClient(rtm._token);

  if (req.body.channel) {
    webClient.channels.list({}, function(error, response) {
      if (!response.ok) { res.send("error!"); return; } //TODO: alert
      for (var i = 0; i < response.channels.length; i++) {
        var channel = response.channels[i];
        if (channel.name !== req.body.channel.replace('#', '')) { continue; }
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
  var user = rtm.dataStore.getUserById(req.body.user_id);
  var dm = rtm.dataStore.getDMByName(user.name);
  rtm.sendMessage(req.body.message, dm.id);
  res.send("ok");
  return;
});

app.get('/debugger', function(req, res) { debugger; });

// Say the string txt to everyone in the channel
var shout = function(res, txt) {
  res.send({ "response_type": "in_channel",
             "text"         : txt })
}

app.post('/roll', function(req, res) {
  var text = req.body.text;
  var n = parseInt(text);
  if (isNaN(n)) {
    res.send("Pssst, this is not an integer: " + text)
  } else if (n <= 0) {
    shout(res, "Rolling " + n + "-sided die... "
      + (Math.random() < 0.1 ? ":poop:" : ":boom:")
      + " (try again with a positive number of sides?)")
  } else {
    shout(res, "Rolling " + n + "-sided die... it came up "
      + (Math.floor(Math.random()*n)+1))
  }
});


var isEmpty = function(obj) {
  return Object.keys(obj).length === 0
}

// Returns a hash of usernames (without the @'s) who are @-mentioned in s
var attabid = function(s) {
  var pattern = /\B@[a-z0-9_-]+/gi; // regex for @-mentions, HT StackOverflow
  var users = {};
  if (s.match(pattern)) {
    s.match(pattern).forEach(function(u) { users[u.replace("@", "")] = ""; })
  }
  return users
}

// Want to refactor this so it just returns the string with the auction 
// status and then the main logic decides when to shout it.
var bidStatus = function(res, channelId) {
  var haveBids = "Got bids from {";
  var needBids = "waiting on {";

  redis.hgetall("beebot.auctions." + channelId + ".bids", function(err, obj) {
    var haveAnyBids = false;
    var haveAnyStragglers = false;
    Object.keys(obj).forEach(function(bidder) {
      if (obj[bidder].length > 0) {
        haveBids += bidder + ", ";
        haveAnyBids = true;
      } else {
        needBids += bidder + ", ";
        haveAnyStragglers = true;
      }
    });
    if (haveAnyBids)       { haveBids = haveBids.slice(0, -2); }
    haveBids += "}, ";
    if (haveAnyStragglers) { needBids = needBids.slice(0, -2); }
    needBids += "}";
    // does the following need to be wrapped in hgetall? seems like no
    //redis.hgetall("beebot.auctions." + channelId, function(err, obj) {
    shout(res, haveBids + needBids);
    //});   // but if bidStatus wanted to include urtext we'd need this wrapper?
  });
};

var bidEnd = function(channelId) {
  redis.hgetall("beebot.auctions." + channelId, function(err, obj) {
    redis.del("beebot.auctions." + channelId, function(err, obj) {
      redis.del("beebot.auctions." + channelId + ".bids", function(err, obj) {
        // nothing
      });
    });
  });
}

var bidHelp = "*Usage for the /bid command:*\n"
  + "/bid help -- duh, that's why you're seeing this\n"
  + "/bid -- with no args, checks on the status of the current auction\n"
  + "/bid stuff -- submits your bid (can repeat it till last person bids\n"
  + "/bid stuff with @-mentions -- starts a new auction with the some people";

app.post('/bid', function(req, res) {
  if (req.body.token != "yzHrfswp6FcUbqwJP4ZllUi6") {
    res.send("This request didn't come from Slack!");
  }
  var text = req.body.text;
  var bids = attabid(text);
  redis.hgetall("beebot.auctions." + req.body.channel_id, function(err, obj) {
    if (obj) { //-------------------------------- active auction in this channel
      if (text === "") {
        bidStatus(res, req.body.channel_id);
      } else if (text.match(/help/i)) {
        shout(res, "Currently active auction:\n" + obj.purpose + "\n" + bidHelp)
      } else if (text.match(/abort/i))Commands are /bid help (duh), /bid  {
        bidEnd(req.body.channel_id);
        // TODO: repeat the list of who's bid, then say "aborted."
        shout(res, "Aborted.");
      } else if (!isEmpty(bids)) {
        res.send("No @-mentions allowed in bids! " 
          //+ "There is currently an active auction for " + purpose + ". "
          + "Do `/bid abort` to end current auction or `/bid` to check status.")
      } else {
        redis.hset("beebot.auctions." + req.body.channel_id + ".bids", 
          req.body.user_name, req.body.text, function(err, obj) {
          redis.hgetall("beebot.auctions." + req.body.channel_id + ".bids", 
            function(err, obj) {
            var bidSummary = ""; // Could start with "Bidding complete!\n"
            var missingBid = false;
            Object.keys(obj).forEach(function(bidder) {
              if (obj[bidder].length > 0) {
                bidSummary += bidder + ": " + obj[bidder] + "\n";
              } else {
                missingBid = true;
              }
            });
            if (missingBid) {
              res.send("Got your bid!"); // TODO: or "updated your bid"
            } else {
              bidEnd(req.body.channel_id);
              bidSummary += "\nBernoulli(0.1) says " 
                + (Math.random() < 0.1 ? "PAY 10X!!" : "no payments!");
              shout(res, bidSummary);
            }
          });
        });
      }
    } else { //------------------------------- no active auction in this channel
      if (text === "") {
        res.send("No current auction! @-mention people to start one.");
      } else if (text.match(/help/i)) {}
        res.send(bidHelp)
      } else if (text.match(/abort/i)) {
        res.send("No current auction!"); // spec says shout this? shrug
      } else if (!isEmpty(bids)) {
        bids[req.body.user_name] = "";

        redis.hmset("beebot.auctions." + req.body.channel_id + ".bids", bids, 
          function(err, obj) {
            //nothing
          });

        var auction = {};
        auction.purpose = text.trim(); // includes the @-mentions; aka urtext
        redis.hmset("beebot.auctions." + req.body.channel_id, auction, 
          function(err, obj) {
            bidStatus(res, req.body.channel_id);
          });
      } else {
        res.send("No current auction! @-mention people to start one.")
      }
    }
  });
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
