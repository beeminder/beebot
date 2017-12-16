// --------------------------------- 80chars ---------------------------------->
var request = require('request')

// There are 3 ways to send messages to the channel:
// 1. whisp: reply to the user who typed the slash command so only they see it
// 2. holla: echo the slash command publicly & reply (holla back) publicly
// 3. blurt: say something publicly & asynchronously, no echoing slash command

// Respond with string txt (and optional text attachment att) to just the user
// who issued the slash command, and don't echo their slash command. WHISPer.
var whisp = (res, txt, att) => {
  att = typeof att !== 'undefined' ? att : null
  res.send({ "response_type": "ephemeral",
             "text": txt,
             "attachments": [{"text": att}]})
}

// Respond with string txt to everyone in the channel, echoing the slash command
var holla = (res, txt) => {
  res.send({ "response_type": "in_channel", "text": txt })
}

// Post string txt to everyone in the channel, no echoing of the slash command
var blurt = (rurl, txt) => {
  request.post(rurl, { json: {
    "response_type": "in_channel", // in_channel vs ephemeral
    "text": txt}
  }, (error, response, body) => { 
    console.log("error handling? pshaw.")
  })
}

// Bernoulli trial with probability p
var bern = (p) => { return (Math.random() < p) }

// Random integer from 1 to n inclusive
var randint = (n) => { return Math.floor(Math.random()*n)+1 }

// StackOverflow says this is how you check if a hash is empty in ES5
var isEmpty = (obj) => { return Object.keys(obj).length === 0 }

// Returns a function that generates redis key names
var keyfn = (botname) => {
  return (...k) => {
    return ["beebot", botname].concat(k).join(".")
  }
}

module.exports = {
  whisp,
  holla,
  blurt,
  bern,
  randint,
  isEmpty,
  keyfn,
}
// --------------------------------- 80chars ---------------------------------->
