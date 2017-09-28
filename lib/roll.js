// --------------------------------- 80chars ---------------------------------->
const botils = require('./botils.js')
const holla   = botils.holla
const whisp   = botils.whisp
const randint = botils.randint
const bern    = botils.bern

var handleSlash = function(req, res) {
  var text = req.body.text
  var n = parseInt(text)
  if (isNaN(n)) {
    whisp(res, "Pssst, this is not an integer: " + text)
  } else if (n <= 0) {
    holla(res, "Rolling " + n + "-sided die... "
      + (bern(0.1) ? ":poop:" : ":boom:")
      + " (try again with a positive number of sides?)")
  } else {
    holla(res, "Rolling " + n + "-sided die... it came up " + randint(n))
  }
  // TODO: whisper help in response to /roll or /roll help
}

module.exports = {
  handleSlash
}
// --------------------------------- 80chars ---------------------------------->
