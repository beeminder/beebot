require('dotenv').load()

if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL)
  var redis = require("redis").createClient(rtg.port, rtg.hostname)
  redis.auth(rtg.auth.split(":")[1])
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

app.post('/bot', (req, resp) => {
  console.log("Request body: " + JSON.stringify(req.body))
  beebot.handleCreateBot(req, resp)
})

app.delete('/bot', (req, resp) => {
  console.log("Request body: " + JSON.stringify(req.body))
  // TODO: delete a bot if a user deauths from a team.
  // need to delete the teamId from redis so we don't keep trying
  // to create it on restarts
})

app.post('/zeno', (req, resp) => {
  console.log("Request body: " + JSON.stringify(req.body))
  beebot.handleZeno(req, resp)
})

app.get('/debugger', (req, resp) => { debugger })

app.post('/bid', (req, resp) => {
  console.log("Request body: " + JSON.stringify(req.body))
  bid.handleSlash(req, resp)
})

app.post('/tock', (req, resp) => {
  console.log("Request body: " + JSON.stringify(req.body))
  tock.handleSlash(req, resp) 
})

app.post("/check", (req, resp) => {
  console.log("Request body: " + JSON.stringify(req.body))
  tock.checkTocks()
  charge.checkCharges()
  resp.send("ok")
})

app.post('/roll', (req, resp) => {
  console.log("Request body: " + JSON.stringify(req.body))
  roll.handleSlash(req, resp)
})

app.post('/charge', (req, resp) => {
  console.log("Request body: " + JSON.stringify(req.body))
  charge.handleSlash(req, resp)
})

app.post('/karma', (req, resp) => {
  console.log("Request body: " + JSON.stringify(req.body))
  karma.handleSlash(req, resp)
})

app.get('/ping', (req, resp) => {
  console.log("Request body: " + JSON.stringify(req.body))
  tagtime.handlePing(req, resp)
})

app.post('/tagtime', (req, resp) => {
  console.log("Request body: " + JSON.stringify(req.body))
  tagtime.handleSlash(req, resp)
})

app.listen(app.get('port'), () => {
  console.log('Beebot app is listening on port', app.get('port'))
  redis.keys("beebot.teamid.*", (err, obj) => {
    for (var i = 0; i < obj.length; i++) {
      var teamId = obj[i].split(".").pop()
      console.log(`Doing beebot.startBot(${teamId})`)
      beebot.startBot(teamId)
    }
    // I think that whole for loop can replace with this:
    //obj.forEach(x => beebot.startBot(x.split(".").pop()))
  })
})
