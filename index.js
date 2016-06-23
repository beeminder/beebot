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
var bodyParser = require('body-parser');

var beebot     = require('./lib/beebot.js');
var bid        = require('./lib/bid.js');
var tock       = require('./lib/tock.js');
var roll       = require('./lib/roll.js');
var charge     = require('./lib/charge.js');

// Ideas for future slash commands...
// Predictionbook bot:
// /bet such-and-such happens p=.3 #foo
// Karmabot (needs to be opt-in):
// /karma on
// TagTime (start with just announcing pings on the universal schedule)
// /tagtime on

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('port', (process.env.PORT || 5000));

app.post('/bot', function(req, res) {
  console.log("Request body: " + JSON.stringify(req.body));
  beebot.handleCreateBot(req, res);
});

app.delete('/bot', function(req, res) {
  console.log("Request body: " + JSON.stringify(req.body));
  // TODO: delete a bot, if a user deauths from a team.
  // basically just need to delete the teamId from redis so we don't keep trying
  // to create it on restarts
});

app.post('/zeno', function(req, res) {
  console.log("Request body: " + JSON.stringify(req.body));
  beebot.handleZeno(req, res);
});

app.get('/debugger', function(req, res) { debugger; });

app.post('/bid', (req, res) => {
  console.log("Request body: " + JSON.stringify(req.body));
  bid.handleSlash(req, res);
})

app.post('/tock', function(req, res) {
  console.log("Request body: " + JSON.stringify(req.body));
  tock.handleSlash(req, res);
})

app.post("/check", function(req, res) {
  console.log("Request body: " + JSON.stringify(req.body));
  tock.checkTocks();
  charge.checkCharges();
  res.send("ok");
})

app.post('/roll', function(req, res) {
  console.log("Request body: " + JSON.stringify(req.body));
  roll.handleSlash(req, res);
})

app.post('/charge', function(req, res) {
  console.log("Request body: " + JSON.stringify(req.body));
  charge.handleSlash(req, res);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
  redis.keys("beebot.teamid.*", function(err, obj) {
    for (var i = 0; i < obj.length; i++) {
      var teamId = obj[i].split(".").pop();
      beebot.startBot(teamId);
    }
  });
});
