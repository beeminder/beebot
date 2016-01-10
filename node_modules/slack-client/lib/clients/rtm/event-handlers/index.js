/**
 *
 */

var RTM_EVENTS = require('../events/rtm-events').EVENTS;

var forEach = require('lodash').forEach;


var handlerModules = [
    require('./bots'),
    require('./channels'),
    require('./groups'),
    require('./dm'),
    require('./presence'),
    require('./stars'),
    require('./team'),
    require('./user'),
    require('./message'),
    require('./reactions')
];


var handleError = function () {
    //return this.emit('error', message.error);
};


var handlers = {};

forEach(handlerModules, function (mod) {
    forEach(mod, function (val, key) {
        handlers[key] = val;
    });
});


module.exports = handlers;
