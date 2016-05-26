function beetils() {
  // Bernoulli trial with probability p
  this.bern = function(p) { return (Math.random() < p) }

  // Respond with string txt to everyone in the channel, echoing the slash command
  this.shout = function(res, txt) {
    res.send({ "response_type": "in_channel", "text": txt })
  }

  // Respond with string txt (and optional text attachment att) to just the user
  // who issued the slash command, and don't echo their slash command. WHISPer.
  this.whisp = function(res, txt, att) {
    att = typeof att !== 'undefined' ? att : null
    res.send({ "response_type": "ephemeral",
               "text": txt,
               "attachments": [{"text": att}]})
  }

  // Post string txt to everyone in the channel, no echoing of the slash command
  this.shoutDelayed = function(rurl, txt) {
    request.post(rurl, { json: {
      "response_type": "in_channel", // in_channel vs ephemeral
      "text": txt}
    }, function(error, response, body) { }) // error handling? pshaw.
  }

  // Random integer from 1 to n inclusive
  this.randint = function(n) { return Math.floor(Math.random()*n)+1 }

  // StackOverflow says this is how you check if a hash is empty in ES5
  this.isEmpty = function(obj) { return Object.keys(obj).length === 0 }
}

module.exports = beetils;
