// --------------------------------- 80chars ---------------------------------->
const botils = require('./botils.js')
const holla   = botils.holla
const whisp   = botils.whisp
const blurt   = botils.blurt
const randint = botils.randint
const isEmpty = botils.isEmpty
const keyfn   = botils.keyfn

const rkey = keyfn("auctions")


if (process.env.REDIS_URL) {
  //var rtg   = require("url").parse(process.env.REDIS_URL)
  var redis = require("redis").createClient({
    url: process.env.REDIS_URL,
    tls: {
      rejectUnauthorized: false,
    }
  })
  //redis.auth(rtg.auth.split(":")[1])
} else {
  var redis = require("redis").createClient()
}

// Returns a hash of usernames (without the @'s) who are @-mentioned in txt
var bidParse = function(txt) {
  var pattern = /\B@[a-z0-9_-]+/gi // regex for @-mentions, HT StackOverflow
  var users = {}
  if(txt.match(pattern)) { // RegExp.exec() might avoid doing match in 2 places
    txt.match(pattern).forEach(u => { users[u.replace("@", "")] = "" })
  }
  return users
}

// Returns a string representation of the hash (user->bid) of everyone's bids
var bidSummary = function(bids) {
  var row = function(u) { return bids[u] ? "\t@" + u + ": " + bids[u]
                                         : "\t~@" + u + "~" }
  return Object.keys(bids).map(row).join("\n")
}

// Takes hash of users->bids, constructs a string like
// "Got bids from {...}, waiting on {...}"
var bidStatus = function(bids) {
  return "Got bids from {"
    + Object.keys(bids).filter(x =>  bids[x]).join(", ") + "}, waiting on {"
    + Object.keys(bids).filter(x => !bids[x]).join(", ") + "}"
}
// --------------------------------- 80chars ---------------------------------->

// Returns whether any of the bids are missing
var bidMissing = function(bids) {
  return Object.keys(bids).some(function(x) { return !bids[x] })
}

// Fetches the hash of bids, h, and then hollas the string indicated by the
// template, substituting $SUMMARY and $STATUS with bidSummary(h) and
// bidStatus(h), respectively.
// (The goofiness with passing in a template and substituting is that hgetall
// is asynchronous. If it were synchronous we'd just fetch the hash of bids and
// then use that to format the output when ready to output it. Instead we need
// to pass a callback function to hgetall and let that function do whatever it's
// going to do with the bid hash -- in our case holla it in the channel.)
var bidAsyncShout = function(res, chan, template) {
  redis.hgetall(rkey(chan, "bids"), function(err, obj) {
    holla(res, template.replace("$SUMMARY", bidSummary(obj))
                       .replace("$STATUS",  bidStatus(obj)))
  })
}

// Initialize the auction and shot that it's started
var bidStart = function(res, chan, user, text, others) {
  others[user] = "" // "others" now includes initiating user too
  redis.hmset(rkey(chan, "bids"), others, function(err,obj){})
  var auction = {}
  auction.urtext = "/bid " + text.trim()
  auction.initiator = user
  redis.hmset(rkey(chan), auction, function(err, obj) {
    bidAsyncShout(res, chan, "Auction started! $STATUS")
  })
}

// Deletes all the bids
var bidReset = function(chan) {
  redis.hgetall(rkey(chan), function(err, obj) {
    redis.del(rkey(chan), function(err, obj) {
      redis.del(rkey(chan, "bids"), function(err, obj) { })
    })
  })
}

// Just returns a string about whether to 10X the payments. Note that the /bid
// command doesn't actually parse out numbers or deal with payments in any way.
var bidPay = function() {
  var y, n, r = randint(10) // randint(10)==1 is the same as bern(.1)
  y = "/roll 10 → 1 ∴ PAY 10X! :money_with_wings: :moneybag: :money_mouth_face:"
  n = "/roll 10 → " + r + " ∴ no payments! :sweat_smile:"
  return (r === 1 ? y : n)
}

// Add text as user's bid, holla the results if user is the last one to bid
var bidProc = function(res, chan, user, text, rurl) {
  redis.hset(rkey(chan, "bids"), user, text,
    function(err, obj) {
      redis.hgetall(rkey(chan, "bids"),
        function(err, obj) { // obj is now the hash from users to bids
          whisp(res, "Got your bid: " + text)
          if (bidMissing(obj)) {
            blurt(rurl, "New bid from " + user + "! " + bidStatus(obj))
          } else {
            bidReset(chan)
            blurt(rurl,
              "Got final bid from " + user + "! :tada: Results:\n"
              + bidSummary(obj) + "\n\n_" + bidPay() + "_")
          }
        })
    })
}

// whisper the documentation
var help = function(res) {
  whisp(res, "How to use /bid\n"
  + "`/bid stuff with @-mentions` start new auction with the mentioned people\n"
  + "`/bid stuff` submit your bid (fine to resubmit till last person bids)\n"
  + "`/bid` (with no args) check who has bid and who we're waiting on\n"
  + "`/bid status` show how current auction was initiated and who has bid\n"
  + "`/bid abort` abort the current auction, showing partial results\n"
  + "`/bid help` show this (see doc.bmndr.com/sealedbids for gory details)")
}

var handleSlash = function(req, res) {
  if(req.body.token !== process.env.SLACK_TOKEN) {
    whisp(res, "This request didn't come from Slack!")
    return
  }
  var rurl = req.body.response_url // for delayed responses to slash commands
  var chan = req.body.channel_id
  var user = req.body.user_name
  var text = req.body.text
  var urtext = "*/bid " + text + "*\n"
  var others = bidParse(text)
  redis.hgetall(rkey(chan), function(err, obj) {
    if(obj) { //--------------------------------- active auction in this channel
      if(!isEmpty(others)) {
        whisp(res, urtext + "No @-mentions allowed in bids! Try `/bid help`")
      } else if(text === "") { // no args
        bidAsyncShout(res, chan, "$STATUS")
      } else if(text === "status") {
        bidAsyncShout(res, chan, "Currently active auction initiated by @"
          + obj.initiator + " via:\n`" + obj.urtext + "`\n$STATUS")
      } else if(text === "abort") {
        bidAsyncShout(res, chan,
          "*Aborted.* :panda_face: Partial results:\n$SUMMARY"
          + "\n\n_" + bidPay() + "_")
        bidReset(chan)
      } else if(text === "help") {
        help(res)
      } else if(text === "debug")  {
        whisp(res, urtext + "whispered reply. obj = " + JSON.stringify(obj))
        blurt(rurl, "We can also reply publicly w/out echoing the cmd!")
      } else {  // if the text is anything else then it's a normal bid
        // could check if user has an old bid so we can say "Updated your bid"
        bidProc(res, chan, user, text, rurl)
      }
    } else { //------------------------------- no active auction in this channel
      if(!isEmpty(others))       { bidStart(res, chan, user, text, others) }
      else if(text === "")       { whisp(res, urtext + "No current auction") }
      else if(text === "status") { holla(res, "No current auction") }
      else if(text === "abort")  { whisp(res, urtext + "No current auction") }
      else if(text === "help")   { help(res) }
      else if(text === "debug")  { whisp(res, urtext + "No current auction") }
      else { // if the text is anything else then it would be a normal bid
        whisp(res, "/bid " + text + "\nNo current auction! Try `/bid help`")
      }
    }
  })
}

module.exports = {
  handleSlash
}
