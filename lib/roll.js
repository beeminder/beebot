// --------------------------------- 80chars ---------------------------------->
const botils = require('./botils.js')
const holla   = botils.holla
const whisp   = botils.whisp
const randint = botils.randint
const bern    = botils.bern

var handleSlash = function(req, resp) {
  var text = req.body.text
  if (text === '' || text === 'help') {
    whisp(resp, "How to use /roll\n"
    + "`/roll N` roll an N-sided die\n"
    + "`/roll help` show this")
    return
  }
  var n = parseInt(text)
  if (isNaN(n)) {
    whisp(resp, "Pssst, this is not an integer: " + text)
  } else if (n <= 0) {
    holla(resp, "Rolling " + n + "-sided die... "
      + (bern(0.1) ? ":poop:" : ":boom:")
      + " (try again with a positive number of sides?)")
  } else {
    holla(resp, "Rolling " + n + "-sided die... it came up " + randint(n))
  }
}

module.exports = {
  handleSlash
}
// --------------------------------- 80chars ---------------------------------->
