/**
 *
 */

var isEmpty = require('lodash').isEmpty;


var Model = function(name, opts) {

    /**
     * The name of the model.
     * @type {string}
     * @protected
     */
    this._modelName = name;

    this.setProperties(isEmpty(opts) ? {} : opts);
};


Model.prototype.setProperties = function(opts) {

};


Model.prototype.toJSON = function() {

};


Model.prototype.toString = function() {

};


module.exports = Model;
