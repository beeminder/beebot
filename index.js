require('dotenv').load();
if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var redis = require("redis").createClient(rtg.port, rtg.hostname);
  redis.auth(rtg.auth.split(":")[1]);
} else {
  var redis = require("redis").createClient();
}

var express    = require('express');
var url        = require('url');
var request    = require('request');
var https      = require('https');
var http       = require('http');
var bodyParser = require('body-parser');

var beetils    = require('./lib/beetils.js');
var beebot     = require('./lib/beebot.js');
var bid        = require('./lib/bid.js');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('port', (process.env.PORT || 5000));

app.post('/bot', function(req, res) {
  redis.hmset("beebot.teamid." + req.body.team_id,
    { bot_access_token: req.body.bot_access_token },
    function(err, obj) {
      beebot.startBot(req.body.team_id);
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

// BEGIN bid
app.post('/bid', (req, res) => {
  bid.handleSlash(req, res);
})
// END bid //

// BEGIN TOCKBOT //
var updateBeeminder = function(teamId, userId, slug, tocktext) {
  https.get("https://www.beeminder.com/slackbot?command="
    + encodeURIComponent(slug + " ^ " + " 1 \"" + tocktext + "\"") + "&team_id="
    + teamId + "&user_id=" + userId
  ).on('error', (e) => { console.error(e); });
}

app.post('/tock', function(req, res) {
  if(req.body.token != process.env.SLACK_TOKEN) {
    beetils.whisp(res, "This request didn't come from Slack!")
  }
  var chan = req.body.channel_id
  var team_id = req.body.team_id
  var user_id = req.body.user_id
  var user = req.body.user_name
  var text = req.body.text

  if (text === "abort") {
    redis.zrangebyscore("beebot.tockbot.tocks." + chan, Date.now(), "inf",
      function(err, obj) {
        var foundTock = false;
        obj.forEach(function(e) {
          var tock = JSON.parse(e);
          if (tock.user === user) {
            foundTock = true;
            redis.zremrangebyscore("beebot.tockbot.tocks." + chan,
              tock.dueby,
              tock.dueby,
              function(err, obj) {
                beetils.shout(res, "Ended tock for " + user);
              }
            );
          }
        });
        if (!foundTock) {
          beetils.whisp(res, "You don't have an active tock");
        }
      }
    );
  } else if (text === "done") {
    redis.zrangebyscore("beebot.tockbot.tocks." + chan, Date.now(), "inf",
      function(err, obj) {
        var foundTock = false;
        if (!obj) { beetils.whisp(res, "You don't have an active tock"); return; }
        obj.forEach(function(e) {
          var tock = JSON.parse(e);
          if (tock.user === user) {
            foundTock = true;
            redis.zremrangebyscore("beebot.tockbot.tocks." + chan,
              tock.dueby,
              tock.dueby,
              function(err, obj) {
                redis.get("beebot.tockbot.links." + team_id + "." + user,
                  function(err, obj) {
                    if (obj) {
                      // user has linked goal to beeminder.
                      // also pyramid of doooooooom!
                      updateBeeminder(team_id, user_id, obj, tock.text);
                      beetils.shout(res, user + " completed tock: " + tock.text +
                        " :tada:\nUpdating Beeminder goal now...");
                    } else {
                      beetils.shout(res, user + " completed tock: " + tock.text +
                        " :tada:");
                    }
                  }
                );
              }
            );
          }
        });
        if (!foundTock) {
          beetils.whisp(res, "You don't have an active tock");
        }
      }
    );
  } else if (text === "help" || text === "") {
    // whisper the documentation
    beetils.whisp(res, "How to use /tock\n"
    + "`/tock text` start a tock to complete `text`\n"
    + "`/tock done` mark current tock complete\n"
    + "`/tock status` show all tocks in this channel\n"
    + "`/tock beemind goalname` link your tocks to a Beeminder goal named "
    + "`goalname`. Completing a tock will send a datapoint of \"1\" with "
    + "the tock text as the comment to Beeminder.\n"
    + "`/tock unlink` unlink your tocks from Beeminder\n"
    + "`/tock abort` ends your tock without marking as complete\n"
    + "`/tock length N` changes the default tock length for the channel to "
    + "`N` minutes\n"
    + "`/tock help` show this message")
  } else if (text == "unlink") {
    redis.del("beebot.tockbot.links." + team_id + "." + user,
      function(err, obj) {
        beetils.shout(res, "Unlinked tocks from Beeminder for " + user);
    });
  } else if (text.match(/^beemind/)) {
    var goalname = text.split(" ")[1];
    redis.set("beebot.tockbot.links."+ team_id + "." + user, goalname,
      function(err, obj) {
        beetils.shout(res, "Linked tocks for "+ user +" to Beeminder goal "+ goalname);
    });
  } else if (text.match(/^length ([\d]*)/)) {
    var length = text.match(/^length ([\d]*)/)[1];
    redis.set("beebot.tockbot.channels." + chan + ".length", length,
      function(err, obj) {
        beetils.shout(res, "New tocks are now "+ length +" minutes long. Active tocks "+
          "are unaffected.");
    });
  } else if (text === "status") {
    redis.zrangebyscore("beebot.tockbot.tocks." + chan, Date.now(), "inf",
      function(err, obj) {
        var rText = "";
        obj.forEach(function(e) {
          var tock = JSON.parse(e);
          var date = new Date(tock.dueby);
          var now =  new Date();
          var minutes = Math.floor(((date - now)/1000)/60);
          var seconds = Math.floor(((date - now)/1000) % 60);
          rText += user + " is working on " + tock.text + ". Due in " +
            minutes + " minutes " + seconds + " seconds" + "\n";
        });
        if (rText === "") { rText = "No active tocks - get to work, slackers!";}
        beetils.shout(res, rText);
      }
    );
  } else {
    redis.get("beebot.tockbot.channels." + chan + ".length", function(err, obj) {
      var length = 45;
      if (obj) { length = obj - 0; }
      var dueby = Date.now() + 1000*60*length;
      var tock = {
        chan: chan,
        team_id: team_id,
        user: user,
        text: text,
        dueby: dueby
      };
      redis.zadd("beebot.tockbot.tocks." + chan, dueby, JSON.stringify(tock),
        function(err, obj) {
          beetils.shout(res, "Started tock for " + user + ": " + text);
        }
      );
    });
  }
})

app.post("/tockcheck", function(req, res) {
  // end all tocks with end dates < now, post as failures to channel
  redis.keys("beebot.tockbot.tocks.*", function(err, obj) {
    for (var i = 0; i < obj.length; i++) {
      var chan = obj[i].split(".").pop();
      redis.zrangebyscore("beebot.tockbot.tocks." + chan,
        Date.now() - 63000, // everything that's expired in the last 63 seconds
        Date.now(),
        function(err, obj) {
          obj.forEach(function(e) {
            var tock = JSON.parse(e);
            var message = tock.user +
              " failed to complete "+ tock.text +" :panda_face:";
            var rtm = bots.filter(function(b) {
              return b.teamId === tock.team_id; })[0];

            if (rtm === null) { res.send("500"); return; }

            var WebClient = require('@slack/client').WebClient;
            var webClient = new WebClient(rtm._token);
            rtm.send({ id      : 1,
                       type    : "message",
                       channel : tock.chan,
                       text    : message });
          });
        }
      );
    }
  });
  res.send("ok");
})
// END TOCKBOT //

// START ROLL COMMAND //
app.post('/roll', function(req, res) {
  var text = req.body.text
  var n = parseInt(text)
  if(isNaN(n)) {
    beetils.whisp(res, "Pssst, this is not an integer: " + text)
  } else if(n <= 0) {
    beetils.shout(res, "Rolling " + n + "-sided die... "
      + (beetils.bern(0.1) ? ":poop:" : ":boom:")
      + " (try again with a positive number of sides?)")
  } else {
    beetils.shout(res, "Rolling " + n + "-sided die... it came up " + beetils.randint(n))
  }
  // TODO: whisper help in response to /roll or /roll help
})
// END ROLL COMMAND //

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
  redis.keys("beebot.teamid.*", function(err, obj) {
    for (var i = 0; i < obj.length; i++) {
      var teamId = obj[i].split(".").pop();
      console.log(teamId);
      beebot.startBot(teamId);
    }
  });
});
