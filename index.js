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

// Respond with string txt to everyone in the channel, echoing the slash command
var shout = function(res, txt) {
  res.send({ "response_type": "in_channel", "text": txt })
}

var whisp = function(res, txt, att) {
  att = typeof att !== 'undefined' ? att : null
  res.send({ "response_type": "ephemeral",
             "text": txt,
             "attachments": [{"text": att}]})
}

// Post string txt to everyone in the channel, no echoing of the slash command
var shoutDelayed = function(rurl, txt) {
  request.post(rurl, { json: { 
    "response_type": "in_channel", // in_channel vs ephemeral
    "text": txt} 
  }, function(error, response, body) { }) // error handling? pshaw.
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

// Returns a hash of usernames (without the @'s) who are @-mentioned in txt
var bidParse = function(txt) {
  var pattern = /\B@[a-z0-9_-]+/gi // regex for @-mentions, HT StackOverflow
  var users = {}
  if(txt.match(pattern)) { // RegExp.exec() might avoid doing match in 2 places
    txt.match(pattern).forEach(function(u) { users[u.replace("@", "")] = "" })
  }
  return users
}

// Returns a string representation of the hash (user->bid) of everyone's bids
var bidSummary = function(bids) {
  var row = function(u) { return bids[u] ? "\t@" + u + ": " + bids[u] 
                                         : "\t~@" + u + "~" }
  return Object.keys(bids).map(row).join("\n")
}

// Takes hash of users->bids, constructs a string like 
// "Got bids from {...}, waiting on {...}"
var bidStatus = function(bids) {
  return "Got bids from {" 
    + Object.keys(bids).filter(function(x) { return  bids[x] }).join(", ")
    + "}, waiting on {"
    + Object.keys(bids).filter(function(x) { return !bids[x] }).join(", ")
    + "}"
}

// Returns whether any of the bids are missing
var bidMissing = function(bids) {
  return Object.keys(bids).some(function(x) { return !bids[x] })
}

// Fetches the hash of bids, h, and then shouts the string indicated by the 
// template, substituting $SUMMARY and $STATUS with bidSummary(h) and 
// bidStatus(h), respectively.
// (The goofiness with passing in a template and substituting is that hgetall
// is asynchronous. If it were synchronous we'd just fetch the hash of bids and 
// then use that to format the output when ready to output it. Instead we need 
// to pass a callback function to hgetall and let that function do whatever it's
// going to do with the bid hash -- in our case shout it in the channel.)
var bidAsyncShout = function(res, chan, template) {
  redis.hgetall("beebot.auctions." + chan + ".bids", function(err, obj) {
    shout(res, template.replace("$SUMMARY", bidSummary(obj))
                       .replace("$STATUS",  bidStatus(obj)))
  })
}

// Initialize the auction and shot that it's started
var bidStart = function(res, chan, user, text, others) {
  others[user] = "" // "others" now includes initiating user too
  redis.hmset("beebot.auctions." + chan + ".bids", others, function(err,obj){})
  var auction = {}
  auction.urtext = "/bid " + text.trim()
  auction.initiator = user
  redis.hmset("beebot.auctions." + chan, auction, function(err, obj) {
    bidAsyncShout(res, chan, "Auction started! $STATUS")
  })
}

// Deletes all the bids
var bidReset = function(chan) {
  redis.hgetall("beebot.auctions." + chan, function(err, obj) {
    redis.del("beebot.auctions." + chan, function(err, obj) {
      redis.del("beebot.auctions." + chan + ".bids", function(err, obj) { })
    })
  })
}

// Just returns a string about whether to 10X the payments. Note that the /bid
// command doesn't actually parse out numbers or deal with payments in any way.
var bidPay = function() {
  var tenx = bern(0.1)
  return "Bernoulli[.1] says " 
    + (tenx ? "PAY 10X! :money_with_wings: :moneybag: :money_mouth_face:" :
              "no payments! :sweat_smile:")
}

// Add text as user's bid, shout the results if user is the last one to bid
var bidProc = function(res, chan, user, text, rurl) {
  redis.hset("beebot.auctions." + chan + ".bids", user, text, 
    function(err, obj) {
      redis.hgetall("beebot.auctions." + chan + ".bids", 
        function(err, obj) { // obj is now the hash from users to bids
          res.send("Got your bid: " + text) 
          if(bidMissing(obj)) { 
            shoutDelayed(rurl, "New bid from " + user + "! " + bidStatus(obj))
          } else {
            bidReset(chan)
            shoutDelayed(rurl, 
              "*Final bid from " + user + "!* :tada: Results:\n" 
              + bidSummary(obj) + "\n\n_" + bidPay() + "_")
          }
        })
    })
}

var bidHelp = function(res) { 
  whisp(res, "How to use /bid\n"
  + "`/bid stuff with @-mentions` start new auction with the mentioned people\n"
  + "`/bid stuff` submit your bid (fine to resubmit till last person bids)\n"
  + "`/bid` (with no args) check who has bid and who we're waiting on\n"
  + "`/bid status` show how current auction was initiated and who has bid\n"
  + "`/bid abort` abort the current auction, showing partial results\n"
  + "`/bid help` show this (see expost.padm.us/sealedbids for gory details)")
}

app.post('/bid', function(req, res) {
  if(req.body.token != "yzHrfswp6FcUbqwJP4ZllUi6") {
    res.send("This request didn't come from Slack!")
  }
  var rurl = req.body.response_url // for delayed responses to slash commands
  var chan = req.body.channel_id
  var user = req.body.user_name
  var text = req.body.text
  var urtext = "*/bid " + text + "*\n"
  var others = bidParse(text)
  redis.hgetall("beebot.auctions." + chan, function(err, obj) {
    if(obj) { //--------------------------------- active auction in this channel
      if(!isEmpty(others)) {
        res.send(urtext + "No @-mentions allowed in bids! Try `/bid help`")
      } else if(text === "") { // no args
        bidAsyncShout(res, chan, "$STATUS")
      } else if(text === "status") {
        bidAsyncShout(res, chan, "Currently active auction initiated by @" 
          + obj.initiator + " via:\n`" + obj.urtext + "`\n$STATUS")
      } else if(text === "abort") {
        bidAsyncShout(res, chan, 
          "*Aborted.* :panda_face: Partial results:\n$SUMMARY" 
          + "\n\n_" + bidPay() + "_")
        bidReset(chan)
      } else if(text === "help") {
        bidHelp(res)
      } else if(text === "debug")  { 
        whisp(res, urtext + "Whispered reply. obj = " + JSON.stringify(obj))
        shoutDelayed(rurl, "We can also reply publicly w/out echoing the cmd!")
      } else {  // if the text is anything else then it's a normal bid
        // could check if user has an old bid so we can say "Updated your bid"
        bidProc(res, chan, user, text, rurl)
      }
    } else { //------------------------------- no active auction in this channel
      if(!isEmpty(others))       { bidStart(res, chan, user, text, others) }
      else if(text === "")       { res.send(urtext + "No current auction") }
      else if(text === "status") { shout(res, "No current auction") }
      else if(text === "abort")  { res.send(urtext + "No current auction") }
      else if(text === "help")   { bidHelp(res) }
      else if(text === "debug")  { res.send(urtext + "No current auction") }
      else { // if the text is anything else then it would be a normal bid
        res.send("/bid " + text + "\nNo current auction! Try `/bid help`")
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
