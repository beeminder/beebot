var botils = require('./botils.js');
var DEFAULT_TOCK_LENGHTH = 45;

if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var redis = require("redis").createClient(rtg.port, rtg.hostname);
  redis.auth(rtg.auth.split(":")[1]);
} else {
  var redis = require("redis").createClient();
}

var updateBeeminder = function(teamId, userId, slug, tocktext) {
  https.get("https://www.beeminder.com/slackbot?command="
    + encodeURIComponent(slug + " ^ " + " 1 \"" + tocktext + "\"") + "&team_id="
    + teamId + "&user_id=" + userId
  ).on('error', (e) => { console.error(e); });
}

// end all tocks with end dates < now, post as failures to channel
var handleTockcheck = function(req, res) {
  redis.keys("beebot.tockbot.tocks.*", function(err, obj) {
    for (var i = 0; i < obj.length; i++) {
      var chan = obj[i].split(".").pop();
      redis.zrangebyscore("beebot.tockbot.tocks." + chan,
        Date.now() - 90000, // everything that's expired in the last 90 seconds
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

            // remove tock
            redis.zremrangebyscore("beebot.tockbot.tocks." + tock.chan,
              tock.dueby, tock.dueby,
              function(err, obj) {/* nothing yet*/}
            );
          });
        }
      );
    }
  });
  res.send("ok");
}

var help = function(res) {
  // whisper the documentation
  botils.whisp(res, "How to use /tock\n"
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
}

var abortTock = function(res, user, chan) {
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
              botils.shout(res, "Ended tock for " + user);
            }
          );
        }
      });
      if (!foundTock) {
        botils.whisp(res, "You don't have an active tock");
      }
    }
  );
}

var finishTock = function(res, user, chan, team_id, user_id) {
  // get all tocks in the channel with expirations in the future
  redis.zrangebyscore("beebot.tockbot.tocks." + chan, Date.now(), "inf",
    function(err, obj) {
      var foundTock = false;
      if (!obj) { botils.whisp(res, "You don't have an active tock"); return; }
      obj.forEach(function(e) {
        var tock = JSON.parse(e);
        if (tock.user === user) {
          foundTock = true;
          redis.get("beebot.tockbot.links." + team_id + "." + user,
            function(err, goalname) {
              if (goalname) {
                // user has linked goal to beeminder
                updateBeeminder(team_id, user_id, goalname, tock.text);
                botils.shout(res, user + " completed tock: " + tock.text +
                  " :tada:\nUpdating Beeminder goal now...");
              } else {
                botils.shout(res, user + " completed tock: " + tock.text +
                  " :tada:");
              }
            }
          );
        }
      });
      if (!foundTock) {
        botils.whisp(res, "You don't have an active tock");
      }
    }
  );
}

var unlink = function(res, user, team_id) {
  redis.del("beebot.tockbot.links." + team_id + "." + user,
    function(err, obj) {
      botils.shout(res, "Unlinked tocks from Beeminder for " + user);
  });
}

var beemind = function(res, user, chan, team_id, goalname) {
  redis.set("beebot.tockbot.links."+ team_id + "." + user, goalname,
    function(err, obj) {
      botils.shout(res, "Linked tocks for "+ user +" to Beeminder goal "+ goalname);
  });
}

var setChannelLength = function(res, chan, length) {
  redis.set("beebot.tockbot.channels." + chan + ".length", length,
    function(err, obj) {
      botils.shout(res, "New tocks are now "+ length +" minutes long. Active tocks "+
        "are unaffected.");
  });
}

var shoutStatus = function(res, chan) {
  redis.zrangebyscore("beebot.tockbot.tocks." + chan, Date.now(), "inf",
    function(err, obj) {
      var rText = "";
      obj.forEach(function(e) {
        var tock = JSON.parse(e);
        var date = new Date(tock.dueby);
        var now =  new Date();
        var minutes = Math.floor(((date - now)/1000)/60);
        var seconds = Math.floor(((date - now)/1000) % 60);
        var user = tock.user;
        rText += user + " is working on " + tock.text + ". Due in " +
          minutes + " minutes " + seconds + " seconds" + "\n";
      });
      if (rText === "") { rText = "No active tocks - get to work, slackers!";}
      botils.shout(res, rText);
    }
  );
}

var startTock = function(res, chan, user, team_id, text) {
  redis.zrangebyscore("beebot.tockbot.tocks." + chan, Date.now(), "inf",
    function(err, obj) {
      var foundTock = false;
      obj.forEach(function(e) {
        var tock = JSON.parse(e);
        if (tock.user === user) {
          foundTock = true;
        }
      });
      if (foundTock) {
        botils.whisp(res, "You already have a tock: " + tock.text +
          "\nAbort it using `/tock abort` to start a new one.");
      } else {
        // determine the length of the tock based on the channel setting or default
        redis.get("beebot.tockbot.channels." + chan + ".length", function(err, obj) {
          var length = DEFAULT_TOCK_LENGHTH;
          if (obj) { length = parseInt(obj); }
          var dueby = Date.now() + 1000*60*length;
          var tock = {
            chan: chan,
            team_id: team_id,
            user: user,
            text: text,
            dueby: dueby
          };
          // adds the tock object to the sorted set. We sort by dueby and assume
          // that the fact that it's in milliseconds will make it unique to retrieve.
          redis.zadd("beebot.tockbot.tocks." + chan, dueby, JSON.stringify(tock),
            function(err, obj) {
              botils.shout(res, "Started tock for " + user + ": " + text);
            }
          );
        });
      }
    }
  );
}

var handleSlash = function(req, res) {
  if(req.body.token != process.env.SLACK_TOKEN) {
    botils.whisp(res, "This request didn't come from Slack!")
  }
  var chan    = req.body.channel_id
  var team_id = req.body.team_id
  var user_id = req.body.user_id
  var user    = req.body.user_name
  var text    = req.body.text

  if (text === "abort") {
    abortTock(res, user, chan);
  } else if (text === "done") {
    finishTock(res, user, chan, team_id);
  } else if (text === "help" || text === "") {
    help(res);
  } else if (text == "unlink") {
    unlink(res, user, team_id);
  } else if (text.match(/^beemind/)) {
    var goalname = text.split(" ")[1];
    beemind(res, user, chan, team_id, goalname);
  } else if (text.match(/^length ([\d]*)/)) {
    var length = text.match(/^length ([\d]*)/)[1];
    setChannelLength(res, chan, length);
  } else if (text === "status") {
    shoutStatus(res, chan)
  } else {
    startTock(res, chan, user, team_id, text)
  }
}

module.exports = {
  handleSlash: handleSlash,
  handleTockcheck: handleTockcheck
}
// poke
