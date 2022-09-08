require('dotenv').load()

if (process.env.REDIS_URL) {
  //var rtg   = require("url").parse(process.env.REDIS_URL)
  var redis = require("redis").createClient({
    url: process.env.REDIS_URL,
    tls: {
      rejectUnauthorized: false
    }
  })
  //redis.auth(rtg.auth.split(":")[1])
} else {
  var redis = require("redis").createClient()
}

var express    = require('express')
var url        = require('url')
var request    = require('request')
var bodyParser = require('body-parser')

var beebot     = require('./lib/beebot.js')  // the /bee command?
var bid        = require('./lib/bid.js')     // the /bid command
var tock       = require('./lib/tock.js')    // the /tock command
var roll       = require('./lib/roll.js')    // the /roll command
var charge     = require('./lib/charge.js')  // the /charge command
var karma      = require('./lib/karma.js')   // the /karma command
var tagtime    = require('./lib/tagtime.js') // the /tagtime command

var app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.set('port', (process.env.PORT || 5000))

// I don't know what this is for
app.get('/debugger', (req, resp) => { debugger })

function dbg(slash, req) {
  console.log(`/${slash} request body:`, req.body)
}

app.post('/bot', (req, resp) => {
  dbg('bot', req)
  beebot.handleCreateBot(req, resp)
})

app.delete('/bot', (req, resp) => {
  dbg('bot', req)
  // TODO: Delete a bot if a user deauths from a team. Need to delete the 
  // teamId from redis so we don't keep trying to create it on restarts.
})

app.post('/bid',     (q, r) => { dbg('bid',     q);     bid.handleSlash(q, r) })
app.post('/tock',    (q, r) => { dbg('tock',    q);    tock.handleSlash(q, r) })
app.post('/roll',    (q, r) => { dbg('roll',    q);    roll.handleSlash(q, r) })
app.post('/charge',  (q, r) => { dbg('charge',  q);  charge.handleSlash(q, r) })
app.post('/karma',   (q, r) => { dbg('karma',   q);   karma.handleSlash(q, r) })
app.post('/tagtime', (q, r) => { dbg('tagtime', q); tagtime.handleSlash(q, r) })

app.get('/ping',     (q, r) => { dbg('ping',    q); tagtime.handlePing( q, r) })
app.post('/zeno',    (q, r) => { dbg('zeno',    q);  beebot.handleZeno( q, r) })

// There's no /check slash command in the Slack bot; rather this is an endpoint 
// we poll to trigger checks if tocks or charges are due. Presumably that's 
// cron'd in Heroku? Andy?
app.post('/check', (req, resp) => {
  dbg('check', req)
  tock.checkTocks()
  charge.checkCharges()
  resp.send("ok")
})

app.get('/', (req, resp) => {
  resp.send("You have reached the server of Beeminder's Slack bot.\n" +
            "It can't come to the client right now but if you do an OAuth " +
            "dance with Slack (POST to /bot) it will get back to you as " +
            "soon as possible.")
})

app.listen(app.get('port'), () => {
  console.log('Beebot app is listening on port', app.get('port'))
  redis.keys("beebot.teamid.T0HC65LRM", (err, obj) => {
  //redis.keys("beebot.teamid.*", (err, obj) => {
    console.log(`DEBUG1: obj (len=${obj.length}) = ${JSON.stringify(obj)}`)
    for (var i = 0; i < obj.length; i++) {
      var teamId = obj[i].split(".").pop()
      console.log(`Doing beebot.startBot("${teamId}")`)
      try {
      beebot.startBot(teamId)
      } catch (error) {
        console.log("DEBUG LISTEN CATCH", error)
      }
    }
    // I think that whole for loop can be replaced with this:
    //obj.forEach(x => beebot.startBot(x.split(".").pop()))
  })
})
