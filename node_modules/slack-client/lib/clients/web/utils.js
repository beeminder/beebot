/**
 * Facet utility functions.
 */

var assign = require('lodash').assign;
var pick = require('lodash').pick;
var isUndefined = require('lodash').isUndefined;


/**
 *
 * @param {object} data
 * @returns {object}
 */
var getData = function (data, token) {
    var opts = data.opts || {};
    assign(data, opts);
    delete data.opts;

    data = pick(data || {}, function (val) {
        return !isUndefined(val) && val !== null;
    });
    data.token = token;

    return data;
};


module.exports.getData = getData;
