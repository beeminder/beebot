require('dotenv').load();
var slack = require("slack");
var express = require('express');
var app = express();
var url = require('url');
var request = require('request');

app.set('port', (process.env.PORT || 5000));

app.get('/auth', function(req, res) {
  debugger;
  slack.oauth.access({
    "client_id": process.env.CLIENT_ID,
    "client_secret": process.env.CLIENT_SECRET,
    "code": req.query.code
  }, function(request, response) {
    res.send("You've authorized Beeminder! Probably.");
    // parse the response and save to redis
  })
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
