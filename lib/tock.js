// --------------------------------- 80chars ---------------------------------->
const botils = require('./botils.js')
const holla        = botils.holla
const whisp        = botils.whisp
const keyfn        = botils.keyfn

const beebot = require('./beebot.js')
const https  = require('https')

const DEFAULT_TOCK_LENGHTH = 45

const rkey = keyfn("tockbot")

if (process.env.REDIS_URL) {
  //var rtg   = require("url").parse(process.env.REDIS_URL)
  var redis = require("redis").createClient({
    url: process.env.REDIS_URL,
    socket: {
      tls: true,
      rejectUnauthorized: false
    }
  })
  //redis.auth(rtg.auth.split(":")[1])
  console.log("REDIS case 1")
} else {
  var redis = require("redis").createClient()
}

var updateBeeminder = (teamId, userId, slug, tock) => {
  console.log("update Beeminder")
  var now = Date.now()
  var credit = ((now-tock.start)/(tock.dueby-tock.start))
  credit = Math.round(credit*100)/100
  https.get("https://www.beeminder.com/slackbot?command="
    + encodeURIComponent(slug + " ^ " + credit + " \"" + tock.text + "\"") 
    + "&team_id=" + teamId 
    + "&user_id=" + userId
  ).on('error', (e) => { console.error(e) })
}

// end all tocks with end dates < now, post as failures to channel
var checkTocks = () => {
  console.log("ttock checkTocks")
  redis.keys(rkey("tocks", "*"), (err, obj) => {
    for (var i = 0; i < obj.length; i++) {
      var chan = obj[i].split(".").pop()
      redis.zrangebyscore(rkey("tocks", "chan"),
        Date.now() - 90000, // everything that's expired in the last 90 seconds
        Date.now(),
        (err, obj) => {
          obj.forEach((e) => {
            var tock = JSON.parse(e)
            var message = `${tock.user} fail :panda_face: ${tock.text}`
            var rtm = beebot.rtmForTeam(tock.team_id)
            //if (rtm === null) { res.send("500"); return }

            var WebClient = require('@slack/client').WebClient
            var webClient = new WebClient(rtm._token)
            rtm.send({ id      : 1,
                       type    : "message",
                       channel : tock.chan,
                       text    : message })

            // remove tock
            redis.zremrangebyscore(rkey("tocks", tock.chan),
              tock.dueby, tock.dueby, (err, obj) => { 
              /****** what to do when you overrun a tock:
               - cancel `do not disturb` (this may need to happen before
                 announcing that the tock's done)
               - add half credit to attached beem graph
               */ 
              }
            )
          })
        }
      )
    }
  })
}

var help = (res) => {
  // the documentation
  whisp(res, "How to use /tock\n"
  + "`/tock blah blah` start a tock!\n"
  + "`/tock done` end the tock you started\n"
  + "`/tock status` show all started tocks in this channel\n"
  + "`/tock beemind goalname` link your tocks to Beeminder!\n"
  + "`/tock beemind` check what Beeminder goal your tocks are linked to\n"
  + "`/tock unlink` unlink your tocks from Beeminder\n"
  + "`/tock abort` end your tock without counting it\n"
  + "`/tock length N` use `N`-minute tocks in this channel\n"
  + "`/tock help` show this message")
}

var abortTock = (res, user, chan) => {
  redis.zrangebyscore(rkey("tocks", chan), Date.now(), "inf",
    (err, obj) => {
      var foundTock = false
      obj.forEach((e) => {
        var tock = JSON.parse(e)
        if (tock.user === user) {
          foundTock = true
          redis.zremrangebyscore(rkey("tocks", chan),
            tock.dueby,
            tock.dueby,
            (err, obj) => {
              holla(res, "Ended tock for " + user)
            }
          )
        }
      })
      if (!foundTock) {
        whisp(res, "You don't have an active tock")
      }
    }
  )
}
    
var finishTock = (res, user, chan, team_id, user_id) => {
  // get all tocks in the channel with expirations in the future
  redis.zrangebyscore(rkey("tocks", chan), Date.now(), "inf",
    (err, obj) => {
      var foundTock = false
      if (!obj) { whisp(res, "You don't have an active tock"); return }
      obj.forEach((e) => {
        var tock = JSON.parse(e)
        if (tock.user === user) {
          foundTock = true
          // remove tock
          redis.zremrangebyscore(rkey("tocks", tock.chan),
            tock.dueby, tock.dueby,
            (err, obj) => {
              redis.get(rkey("links", team_id, user),
                (err, goalname) => {
                  if (goalname) {
                    // user has linked goal to beeminder
                    updateBeeminder(team_id, user_id, goalname, tock)
                    holla(res, user + " completed tock: " + tock.text +
                      " :tada:\nUpdating Beeminder goal now...")
                  } else {
                    holla(res, `${user} SUCCESS :tada:: ${tock.text}`)
                  }
                }
              )
            }
          )
        }
      })
      if (!foundTock) {
        whisp(res, "You don't have an active tock")
      }
    }
  )
}

var unlink = (res, user, team_id) => {
  redis.del(rkey("links", team_id, user),
    (err, obj) => {
      whisp(res, "Unlinked tocks from Beeminder for " + user)
  })
}

var beemind = (res, user, chan, team_id, goalname=null) => {
  if (goalname) {
    redis.set(rkey("links", team_id, user), goalname,
      (err, obj) => {
        whisp(res, "Linked tocks for "+user+" to Beeminder goal "+goalname)
    })
  } else {
    redis.get(rkey("links", team_id, user),
      (err, goalname) => {
        if (goalname) {
          whisp(res, 
            "Tocks for " + user + " are linked to Beeminder goal " + goalname);
        } else {
          whisp(res, "No Beeminder goal linked");
        }
    });
  }
}

var setChannelLength = (res, chan, length) => {
  redis.set(rkey("channels", chan, "length"), length,
    (err, obj) => {
      holla(res, "New tocks are now "+ length +
                   " minutes long. Active tocks are unaffected.")
    })
}
var echoChannelLength = (res, chan, chanName) => {
  redis.get(rkey("channels", chan, "length"), (err, length) => {
    whisp(res, "Tocks in " + chanName + " are " + length + " minutes long.")
  })
}

var hollaStatus = (res, chan) => {
  redis.zrangebyscore(rkey("tocks", chan), Date.now(), "inf",
    (err, obj) => {
      var rText = "";
      obj.forEach((e) => {
        var tock = JSON.parse(e);
        var date = new Date(tock.dueby);
        var now =  new Date();
        var minutes = Math.floor(((date - now)/1000)/60);
        var seconds = Math.floor(((date - now)/1000) % 60);
        var user = tock.user;
        rText += user + " is working on " + tock.text + ". Due in " +
          minutes + " minutes " + seconds + " seconds" + "\n";
      })
      if (rText === "") { rText = "No active tocks. Get to work, slackers!" }
      holla(res, rText)
    }
  )
}

var startTock = (res, chan, user, team_id, text) => {
  redis.zrangebyscore(rkey("tocks", chan), Date.now(), "inf",
    (err, obj) => {
      var foundTock = false;
      var foundTockText = ""
      obj.forEach((e) => {
        var tock = JSON.parse(e)
        if (tock.user === user) {
          foundTock = true;
          foundTockText = tock.text
        }
      });
      if (foundTock) {
        whisp(res, "You already have a tock: " + foundTockText +
          "\nAbort it using `/tock abort` to start a new one.");
      } else {
        // determine length of the tock based on the channel setting or default
        redis.get(rkey("channels", chan, "length"), (err, obj) => {
          var length = DEFAULT_TOCK_LENGHTH
          if (obj) { length = parseInt(obj) }
          var dueby = Date.now() + 1000*60*length
          var tock = {
            chan: chan,
            team_id: team_id,
            user: user,
            text: text,
            dueby: dueby,
            start: Date.now(),
          }
          // Add the tock object to the sorted set. We sort by dueby and assume
          // that being in milliseconds will make it unique to retrieve.
          redis.zadd(rkey("tocks", chan), dueby, JSON.stringify(tock),
            (err, obj) => {
              holla(res, "Started tock for " + user + ": " + text)
            }
          )
          
          // then, let's also try setting dnd
          var rtm = beebot.rtmForTeam(team_id)
          console.log(rtm)
          var WebClient = require('@slack/client').WebClient
          var webClient = new WebClient(123)
          webClient.dnd.setSnooze(3)
        })
      }
    }
  )
}

var handleSlash = (req, res) => {
  if(req.body.token != process.env.SLACK_TOKEN) {
    whisp(res, "This request didn't come from Slack!")
    return
  }
  var chan    = req.body.channel_id
  var team_id = req.body.team_id
  var user_id = req.body.user_id
  var user    = req.body.user_name
  var text    = req.body.text

  if (text === "abort") {
    abortTock(res, user, chan)
  } else if (text === "done") {
    finishTock(res, user, chan, team_id, user_id)
  } else if (text === "help" || text === "") {
    help(res)
  } else if (text === "unlink") {
    unlink(res, user, team_id)
  } else if (text.match(/^beemind/)) {
    var goalname = text.split(" ")[1]
    beemind(res, user, chan, team_id, goalname)
  } else if (text.match(/^length ([\d]+)/)) {
    var length = text.match(/^length ([\d]*)/)[1]
    setChannelLength(res, chan, length)
  } else if (text === "length") {
    echoChannelLength(res, chan, req.body.channel_name)
  } else if (text === "status") {
    hollaStatus(res, chan)
  } else {
    startTock(res, chan, user, team_id, text)
  }
}

module.exports = {
  handleSlash: handleSlash,
  checkTocks:  checkTocks,
}
