var botils = require('./botils.js');

var handleSlash = function(req, res) {
  var text = req.body.text
  var n = parseInt(text)
  if(isNaN(n)) {
    botils.whisp(res, "Pssst, this is not an integer: " + text)
  } else if(n <= 0) {
    botils.shout(res, "Rolling " + n + "-sided die... "
      + (botils.bern(0.1) ? ":poop:" : ":boom:")
      + " (try again with a positive number of sides?)")
  } else {
    botils.shout(res, "Rolling " + n + "-sided die... it came up " + botils.randint(n))
  }
  // TODO: whisper help in response to /roll or /roll help
}

module.exports = {
  handleSlash: handleSlash
}
