// --------------------------------- 80chars ---------------------------------->
var botils = require('./botils.js')
//var https  = require('https')
var rkey = botils.keyfn("karmabot")

if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL)
  var redis = require("redis").createClient(rtg.port, rtg.hostname)
  redis.auth(rtg.auth.split(":")[1])
} else {
  var redis = require("redis").createClient()
}

function changeKarmaAndPost(rtm, team, channel, entity, delta) {
  redis.zincrby(rkey(team), delta, entity,
  function(err, obj) {
    rtm.send({
      id: 1,
      type: "message",
      channel: channel,
      text: entity + " has " + obj + " karma",
    })
  })
}

var handleMessage = function(rtm, message) {
  console.log("karmabot handling message")
  redis.get(rkey(message.team, "on"), function(err, obj) {
    if (obj && !err) {
      var regex = /(\S+)(\+\+|--)\b/g
      var match = null
      while ((match = regex.exec(message.text)) !== null)
      {
        var matchname = match[1]
        var regexpString = "^<@>"
        if (matchname.match(/^\<\@(.*)\>/)) {
          var userId = matchname.match(/^\<\@(.*)\>/)[1]
          var WebClient = require('@slack/client').WebClient
          var webClient = new WebClient(rtm._token)
          var delta = match[2] === "++" ? 1 : -1
          webClient.users.info(userId, function(error, response) {
            changeKarmaAndPost(rtm, message.team, message.channel,
                               response.user.name, delta)
          })
        }
        else {
          if (match[2] === "++") {
            changeKarmaAndPost(rtm, message.team, message.channel, matchname, 1)
          } else if (match[2] === "--") {
            changeKarmaAndPost(rtm, message.team, message.channel, matchname, -1)
          }
        }
      }
    } else {
      console.log(`DEBUG8: handleMessage error: ${JSON.stringify(err)}`)
    }
  })
}

var help = function(resp) {
  botils.whisp(resp, "How to use /karma\n"
  + "`/karma on` turn karmabot on for this team\n"
  + "`/karma off` turn karmabot off for this team. Saves stored karma\n"
  + "`/karma reset` turn karmabot off for this team. Removes stored karma!\n"
  + "`/karma list` publicly show all karma scores\n"
  + "`/karma list N` publicly show the top `N` karma scores\n"
  + "`/karma help` show this message")
}

var handleSlash = function(req, resp) {
  var beebot = require('./beebot.js')
  if(req.body.token !== process.env.SLACK_TOKEN) {
    botils.whisp(resp, "This request didn't come from Slack!")
    return
  }
  var team_id = req.body.team_id
  var user_id = req.body.user_id
  var user    = req.body.user_name
  var text    = req.body.text
  var rurl    = req.body.response_url

  if (text === "on") {
    redis.set(rkey(team_id, "on"), 1, function(err, obj) {
      console.log(`DEBUG: in handleSlash() about to call ` +
                  `beebot.startBot("${team_id}", ${rurl})`)
      console.log(`DEBUG err/obj = ${JSON.stringify(err)}/${JSON.stringify(obj)}`)
      beebot.startBot(team_id, rurl)
      botils.holla(resp, "now tracking karma")
    })
  } else if (text === "off") {
    redis.del(rkey(team_id, "on"), function(err, obj) {
      botils.holla(resp, "stopped tracking karma")
      beebot.startBot(team_id, rurl)
    })
  } else if (text === "reset") {
    redis.del(rkey(team_id, "on"), function(err, obj) {
      if (!err) {
        redis.del(rkey(team_id), function(err, obj) {
          if (!err) {
            botils.holla(resp, "reset the karma table and stopped tracking.")
            beebot.startBot(team_id, rurl)
          } else {
            botils.holla(resp, "something went wrong trying to reset karma")
          }
        })
      } else {
        botils.holla(resp, "something went wrong trying to reset karma")
      }
    })
  } else if (text.match(/^list/)) {
    var n = text.split(/\s/)[1]
    if (!n || isNaN(parseInt(n))) {
      n = -1 // if N is not specified, return all scores
    } else {
      n = parseInt(n) - 1
    }
    redis.zrevrange(rkey(team_id), 0, n, "WITHSCORES",
    function(err, obj) {
      if (!err) {
        if (obj.length === 0) {
          botils.holla(resp, "No karma yet! Try `karmabot++`?")
          return
        }
        var message = ""
        obj.forEach(function(e, i) {
          // alternately join array with ":" and "\n", e.g. "apb: 5\n bee: 2\n"
          message += e
          message += (i % 2 === 0) ? ": " : "\n"
        })
        botils.holla(resp, message)
      } else {
        botils.whisp(resp, "something went wrong trying to retrieve karma"+err)
      }
    })
  } else {
    help(resp)
  }
}

module.exports = {
  handleSlash: handleSlash,
  handleMessage: handleMessage,
}
// --------------------------------- 80chars ---------------------------------->
