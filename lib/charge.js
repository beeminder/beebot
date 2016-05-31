var botils = require('./botils.js');
if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var redis = require("redis").createClient(rtg.port, rtg.hostname);
  redis.auth(rtg.auth.split(":")[1]);
} else {
  var redis = require("redis").createClient();
}

var help = function(res) {
  // whisper the documentation
  botils.whisp(res, "How to use /charge\n"
  + "`/charge N` charge yourself $N (real, US dollars) via the Beeminder API\n"
  + "`/charge addcard` show the URL to add a payment method to Beeminder"
  + "`/charge N in X [for `reason`]` charge yourself $N in X minutes unless you"
  + " cancel before the timer runs out (e.g. you complete the task)"
  + "`/charge cancel` cancel a pending charge"
  + "`/charge show` shows any pending charge"
  + "`/charge help` show this message")
}

var handleSlash = function(req, res) {
  if(req.body.token != process.env.SLACK_TOKEN) {
    botils.whisp(res, "This request didn't come from Slack!")
  }

  var chan = req.body.channel_id
  var user = req.body.user_name
  var user_id = req.body.user_id
  var team_id = req.body.team_id
  var text = req.body.text

  if (text.match(/[^0-9\.]/) || text.split(".").length > 2) {
    botils.whisp(res, "Amount must be a number");
    return;
  } else if (text === "help") {

  } else if (text === "addcard") {
    botils.whisp(res, "https://www.beeminder.com/settings/payment")
  }

  https.get("https://www.beeminder.com/slackbot?command="
    + encodeURIComponent("**charge " + text) + "&team_id=" + team_id +
    "&user_id=" + user_id,
    function(beemRes) {
      var resText = '';
      beemRes.on("data", function(chunk) { resText += chunk; });

      beemRes.on("end", function() {
        botils.shout(res, resText);
      });
    }).on('error', (e) => { console.error(e); });
}

module.exports = {
  handleSlash: handleSlash
}
