var humps = require('humps');

var eventFixtures = require('./client-events');


var getRTMMessage = function (event, noHumps) {
    return noHumps ? eventFixtures[event] : humps.camelizeKeys(eventFixtures[event])
};


module.exports.getRTMMessage = getRTMMessage;
