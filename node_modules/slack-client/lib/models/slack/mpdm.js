/**
 *
 */

var inherits = require('inherits');

var Model = require('../model');


var MPDM = function(opts) {
    Model.call(this, 'MPDM', opts);
};

inherits(MPDM, Model);


MPDM.prototype.setProperties = function (opts) {
    MPDM.super_.prototype.setProperties.call(this, opts);
};


module.exports = MPDM;
