function beetils() {
  // Bernoulli trial with probability p
  this.bern = function(p) { return (Math.random() < p) }
}

module.exports = beetils;
