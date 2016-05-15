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
        rtm.send({ id      : 1,
                   type    : "message",
                   channel : channel.id,
                   text    : req.body.message });
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

// Bernoulli trial with probability p
var bern = function(p) { return (Math.random() < p) }

// Random integer from 1 to n inclusive
var randint = function(n) { return Math.floor(Math.random()*n)+1 }

app.post('/roll', function(req, res) {
  var text = req.body.text
  var n = parseInt(text)
  if(isNaN(n)) {
    res.send("Pssst, this is not an integer: " + text)
  } else if(n <= 0) {
    shout(res, "Rolling " + n + "-sided die... "
      + (bern(0.1) ? ":poop:" : ":boom:")
      + " (try again with a positive number of sides?)")
  } else {
    shout(res, "Rolling " + n + "-sided die... it came up " + randint(n))
  }
})

// StackOverflow says this is how you check if a hash is empty in ES5
var isEmpty = function(obj) { return Object.keys(obj).length === 0 }

// Returns a hash of usernames (without the @'s) who are @-mentioned in s
var attabid = function(s) {
  var pattern = /\B@[a-z0-9_-]+/gi // regex for @-mentions, HT StackOverflow
  var users = {}
  if(s.match(pattern)) {
    s.match(pattern).forEach(function(u) { users[u.replace("@", "")] = "" })
  }
  return users
}

// Shouts a string like "Got bids from {...}, waiting on {...}"
//TODO: array.join(", ") ?
var bidStatusShout = function(res, chan, pre, post) {
  pre  = typeof pre  !== 'undefined' ? pre  : ""
  post = typeof post !== 'undefined' ? post : ""
  var gotten = "Got bids from {"
  var needed = "waiting on {"

  // NB: the function passed to hgetall is executed asynchronously so anything
  // it does won't have been done yet after the hgetall call.
  redis.hgetall("beebot.auctions." + chan + ".bids", function(err, obj) {
    var anyBids  = false
    var anyStrag = false // flag that becomes true if any stragglers
    Object.keys(obj).forEach(function(bidder) {
      if(obj[bidder].length > 0) { gotten += bidder + ", "; anyBids  = true }
      else                       { needed += bidder + ", "; anyStrag = true }
    })
    if(anyBids)  { gotten = gotten.slice(0, -2) };   gotten += "}, "
    if(anyStrag) { needed = needed.slice(0, -2) };   needed += "}"
    shout(res, pre + gotten + needed + post)
  })
}

// Returns a string representation of the hash of everyone's bids
var bidSummary = function(bids) {
  sumup = ""
  Object.keys(bids).forEach(function(u) {
    if(bids[u].length > 0) { sumup += "@" + u + ": " + bids[u] + "\n" }
  })
  return sumup
}

// Returns whether any of the bids are missing
var stragglers = function(bids) {
  return Object.keys(bids).some(function(x) { return bids[x].length === 0 })
}

// Deletes all the bids
var bidEnd = function(chan) {
  redis.hgetall("beebot.auctions." + chan, function(err, obj) {
    redis.del("beebot.auctions." + chan, function(err, obj) {
      redis.del("beebot.auctions." + chan + ".bids", function(err, obj) { })
    })
  })
}

var bidHelp = "*Usage for the /bid command:*\n"
 + "`/bid stuff with @-mentions`  start new auction with the mentioned people\n"
 + "`/bid stuff`  submit your bid (can resubmit till last person bids)\n"
 + "`/bid`  with no args, check who has bid\n"
 + "`/bid status`  show how current auction was initiated and who has bid\n"
 + "`/bid abort`  abort the current auction\n"
 + "`/bid help`  show this (or see expost.padm.us/sealedbids for gory details)"

app.post('/bid', function(req, res) {
  if(req.body.token != "yzHrfswp6FcUbqwJP4ZllUi6") {
    res.send("This request didn't come from Slack!")
  }
  var chan = req.body.channel_id
  var user = req.body.user_name
  var text = req.body.text
  var others = attabid(text)
  redis.hgetall("beebot.auctions." + chan, function(err, obj) {
    if(obj) { //--------------------------------- active auction in this channel
      if(!isEmpty(others)) { // has @-mentions
        res.send("No @-mentions allowed in bids! Do `/bid help` if confused.")
      } else if(text === "") { // no args
        bidStatusShout(res, chan)
      } else if(text.match(/status/i)) {
        bidStatusShout(res, chan, "Currently active auction initiated by @" 
          + obj.initiator + " via:\n`" + obj.urtext + "`\n")
      } else if(text.match(/abort/i)) {
        bidStatusShout(res, chan, "", "Aborted.")
        bidEnd(chan)
      } else if(text.match(/help/i)) {
        shout(res, bidHelp)
      } else {  // if the text is anything else then it's a normal bid
        // could check if user has an old bid so we can say "Updated your bid"
        redis.hset("beebot.auctions." + chan + ".bids", user, text, 
          function(err, obj) {
            redis.hgetall("beebot.auctions." + chan + ".bids", 
              function(err, obj) { // obj is now the hash from users to bids
                if(stragglers(obj)) { 
                  res.send("Got your bid: " + text) 
                } else {
                  bidEnd(chan)
                  shout(res, "*Bidding complete!*\n" + bidSummary(obj)
                    + "\n_Bernoulli(0.1) says "
                    + (bern(0.1) ? "PAY 10X! " 
                         + ":money_with_wings: :moneybag: :money_mouth_face:_" :
                       "no payments!_"))
                }
              })
          })
      }
    } else { //------------------------------- no active auction in this channel
      if(!isEmpty(others)) { // has @-mentions => start an auction!
        others[user] = "" // "others" now includes iniating user too
        redis.hmset("beebot.auctions." + chan + ".bids", others,
          function(err, obj) { })
        var auction = {}
        auction.urtext = "/bid " + text.trim()
        auction.initiator = user
        redis.hmset("beebot.auctions." + chan, auction, function(err, obj) {
          bidStatusShout(res, chan, "Auction started! ")
        }) }
      else if(text === "")          { res.send("No current auction!") }
      else if(text.match(/help/i))  { res.send(bidHelp) }
      else if(text.match(/abort/i)) { res.send("Error: No current auction!") }
      else { // if the text is anything else then it would be a normal bid
        res.send("Error: No current auction!\nYour attempted bid: " + text
          + "\nDo `/bid help` if confused.")
      }
    }
  })
})

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
