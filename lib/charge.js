var https = require('https');
var botils = require('./botils.js');
var beebot = require('./beebot.js');

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
  + "`/charge N [reason]` charge yourself $N (real, US dollars) via the "
  + "Beeminder API. Optionally include a `reason`\n"
  + "`/charge N in X [reason]` charge yourself $N in X minutes unless you"
  + " cancel before the timer runs out (e.g. you complete the task) Optionally "
  + "include a `reason`\n"
  + "`/charge addcard` show the URL to add a payment method to Beeminder\n"
  + "`/charge cancel` cancel all pending charges\n"
  + "`/charge cancel reason` cancel charge matching `reason`\n"
  + "`/charge list` lists all pending charges\n"
  + "`/charge help` show this message")
}

// run all charges with charge dates < now, post to channel
var checkCharges = function() {
  redis.zrangebyscore("beebot.charges",
    Date.now() - 90000, // everything that was due in the last 90 seconds
    Date.now(),
    function(err, obj) {
      obj.forEach(function(e) {
        var charge = JSON.parse(e);
        if (charge.charged_at) { return; }
        runCharge(null, charge);
        var message = "Charged " + charge.user +" $" + charge.amount +" for "+
          charge.reason +" :bee:";
        var rtm = beebot.rtmForTeam(charge.team_id);
        if (!rtm) { res.send("500"); return; }

        var WebClient = require('@slack/client').WebClient;
        var webClient = new WebClient(rtm._token);
        rtm.send({ id      : 1,
                   type    : "message",
                   channel : charge.chan,
                   text    : message });

        // remove tock and re-add it, marked as charged
        charge.charged_at = Date.now();
        redis.zremrangebyscore("beebot.charges", charge.charge_at,
          charge.charge_at,
          function(err, obj) {
            redis.zadd("beebot.charges", charge.charge_at, JSON.stringify(charge),
              function(err, obj) { /* nothing yet... */ }
            );
          }
        );
      });
    }
  );
}

var scheduleCharge = function(res, charge) {
  // add pending charge to redis. TODO: check if there's already a charge
  // at this exact millisecond and if there is, adjust the charge_at until
  // there isn't one. Or use some other way to avoid collisions.
  redis.zadd("beebot.charges", charge.charge_at, JSON.stringify(charge),
    function(err, obj) {
      var delayMinutes = Math.round((charge.charge_at - Date.now())/60000);
      var message = "Charging " + charge.user +" $"+ charge.amount +" in "+
        delayMinutes + " minutes";
      if (charge.reason) { message += " (" + charge.reason + ")"; }
      botils.shout(res, message);
    }
  );
}

var runCharge = function(res, charge) {
  // send charge to Beeminder. use **charge as the command to avoid
  // collision with a "charge" goalname.
  https.get("https://www.beeminder.com/slackbot?command="
    + encodeURIComponent("**charge") + "&team_id=" + charge.team_id +
    "&user_id=" + charge.user_id + "&note=" + charge.reason + "&amount=" +
    charge.amount,
    function(beemRes) {
      var resText = '';
      beemRes.on("data", function(chunk) { resText += chunk; });

      beemRes.on("end", function() {
        if (res && resText.match(/couldn't charge/i)) {
          botils.whisp(res, resText);
        } else if (res) {
          botils.shout(res, resText);
        }
      });
    }).on('error', (e) => { console.error(e); });
}

var list = function(res, user_id) {
  redis.zrangebyscore("beebot.charges", Date.now(), "inf", function(err, obj) {
    var message = "";
    obj.forEach(function(e) {
      var charge = JSON.parse(e);
      if (charge.user_id != user_id) { return; }
      var delayMinutes = Math.round((charge.charge_at - Date.now())/60000);
      message += "Charging "+ charge.user +" $" + charge.amount +" in "+ delayMinutes +" minutes";
      if (charge.reason) { message += " ("+ charge.reason + ")"; }
      message += "\n";
    });
    if (message === "") { message = "No pending charges for you!"; }
    botils.shout(res, message);
  });
}

var cancel = function(res, user_id, reason) {
  redis.zrangebyscore("beebot.charges", Date.now(), "inf", function(err, obj) {
    var message = "";
    obj.forEach(function(e) {
      var charge = JSON.parse(e);
      if (charge.user_id != user_id) { return; }
      if (reason && charge.reason != reason) { return; }
      redis.zremrangebyscore("beebot.charges", charge.charge_at,
        charge.charge_at, function(err, obj) { /* nothing yet */ });
      message += "Canceled $"+ charge.amount +" charge for "+ charge.user;
      if (charge.reason) { message += " ("+ charge.reason + ")"; }
      message += "\n";
    });
    if (message === "" && !reason) {
      botils.whisp(res, "No pending charges for you!");
    } else if (message === "") {
      botils.whisp(res, "No pending charges matched " + reason + "!");
    } else {
      botils.shout(res, message);
    }
  });
}

var handleSlash = function(req, res) {
  if(req.body.token != process.env.SLACK_TOKEN) {
    botils.whisp(res, "This request didn't come from Slack!");
    return;
  }

  var chan = req.body.channel_id
  var user = req.body.user_name
  var user_id = req.body.user_id
  var team_id = req.body.team_id
  var text = req.body.text

  if (text === "help") {
    help(res);
  } else if (text === "addcard") {
    botils.whisp(res, "https://www.beeminder.com/settings/payment")
  } else if (text === "list") {
    list(res, user_id);
  } else if (text === "cancel") {
    cancel(res, user_id, null);
  } else if (text.match(/^cancel/)) {
    var reason = text.split(" ").slice(1).join(" ");
    cancel(res, user_id, reason);
  } else if (text.match(/^[\d]/)) {
    var charge = {
      chan: chan,
      team_id: team_id,
      user_id: user_id,
      user: user,
      reason: text.split(" ").slice(1).join(" "),
      charge_at: Date.now(),
      amount: text.split(" ")[0]
    };

    // if they've specified a delay, update the delay and the reason.
    if (text.match(/^[\d\.]+\sin\s[\d\.]/)) {
      var delay = parseInt(text.match(/^[\d\.]+\sin\s([\d\.]+)/)[1]);
      charge.charge_at = Date.now() + 1000*60*delay;
      if (text.match(/^[\d\.]+\sin\s([\d\.])+\s+(.*)/)) {
        charge.reason = text.match(/^[\d\.]+\sin\s([\d\.])+\s+(.*)/)[2];
      }
      scheduleCharge(res, charge);
    } else {
      runCharge(res, charge);
    }
  } else {
    help(res);
  }
}

module.exports = {
  handleSlash: handleSlash,
  checkCharges: checkCharges
}
