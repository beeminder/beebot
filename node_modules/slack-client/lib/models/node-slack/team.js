/**
 *
 */

var inherits = require('inherits');

var Model = require('../model');


var Team = function (opts) {
    Model.call(this, 'Team', opts);
};

inherits(Team, Model);


Team.prototype.setProperties = function (opts) {
    Team.super_.prototype.setProperties.call(this, opts);

    this.id = opts['id'];
    this.name = opts['name'];
    this.domain = opts['domain'];
    this.url = opts.url;
    this.prefs = opts.prefs;
};


module.exports = Team;
