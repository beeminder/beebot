/**
 *
 */

var inherits = require('inherits');

var Model = require('../model');


var Bot = function (opts) {
    Model.call(this, 'Bot', opts);
};

inherits(Bot, Model);


Bot.prototype.setProperties = function (opts) {
    Bot.super_.prototype.setProperties.call(this, opts);

    this.id = opts['id'] || '';
    this.delete = opts['deleted'] || false;
    this.name = opts['name'] || '';
    this.icons = opts['icons'] || {};
};


module.exports = Bot;
