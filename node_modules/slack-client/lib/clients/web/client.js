/**
 *
 */

var async = require('async');
var bind = require('lodash').bind;
var forEach = require('lodash').forEach;
var inherits = require('inherits');
var isEmpty = require('lodash').isEmpty;
var isString = require('lodash').isString;
var retry = require('retry');
var startsWith = require('lodash').startsWith;

var BaseAPIClient = require('../client');
var events = require('./events');
var facets = require('./facets/index');
var parseAPIResponse = require('../helpers').parseAPIResponse;
var requestsTransport = require('./transports/request');
var utils = require('./utils');

// TODO(leah): Support:
//   * retry policy


/**
 * Slack Web API client.
 *
 * @param token The Slack API token to use with this client.
 * @param {Object=} opts
 * @param {String} opts.slackAPIUrl The Slack API URL.
 * @param {String} opts.userAgent The user-agent to use, defaults to node-slack.
 * @param {Function} opts.transport Function to call to make an HTTP call to the Slack API.
 * @param {string} opts.logLevel The log level for the logger.
 * @param {Function} opts.logger Function to use for log calls, takes (logLevel, logString) parameters.
 * @param {Number} opts.maxRequestConcurrency The maximum number of requests to make to Slack's API's simultaneously, defaults to 5.
 * @param {Number} opts.requestTimeout The max length of time to wait for a request to complete in ms, defaults to 100 seconds.
 * @param {Object} opts.retryConfig The configuration to use for the retry operation, {@see https://github.com/SEAPUNK/node-retry}
 * @constructor
 */
var WebAPIClient = function(token, opts) {

    opts = opts || {};

    BaseAPIClient.call(this, opts);

    this._token = token;
    this.slackAPIUrl = opts.slackAPIUrl || 'https://slack.com/api/';
    this.transport = opts.transport || requestsTransport;
    this.userAgent = opts.userAgent || 'node-slack';
    // Attempts 5 retries within 5 minutes, with exponential backoff
    this.retryConfig = opts.retryConfig || {
        retries: 5,
        factor: 3.9
    };

    /**
     *
     * @type {Object}
     * @private
     */
    this._requestQueue = new async.priorityQueue(
        bind(this._callTransport, this),
        opts.maxRequestConcurrency || 5
    );

    this._createFacets();
};

inherits(WebAPIClient, BaseAPIClient);


/**
 * @type {String}
 */
WebAPIClient.prototype._token;


/**
 * Initializes each of the API facets.
 * @private
 */
WebAPIClient.prototype._createFacets = function() {
    var makeAPICall = bind(this.makeAPICall, this);
    forEach(facets, function(Facet) {
        var newFacet = new Facet(makeAPICall);
        this[newFacet.name] = newFacet;
    }, this);
};


/**
 * Calls the supplied transport function and processes the results.
 *
 * This will also manage 429 responses and retry failed operations.
 *
 * @param {object} task The arguments to pass to the transport.
 * @param {function} queueCb The callback to signal the request queue that the request has completed.
 * @private
 */
WebAPIClient.prototype._callTransport = function(task, queueCb) {
    var args = task.args;
    var cb = task.cb;
    var self = this;

    var retryOp = retry.operation(this.retryConfig);

    var handleTransportResponse = function(err, headers, statusCode, body) {
        if (err) {
            if (retryOp.retry(err)) {
                return;
            } else {
                cb(retryOp.mainError(), null);
            }
        }

        // NOTE: this assumes that non-200 codes simply won't happen, as the Slack API policy is to return a 200 with an error property
        if (statusCode !== 200) {
            // There are only a couple of possible bad cases here:
            //   - 429: the application is being rate-limited. The client is designed to automatically respect this
            //   - 4xx or 5xx: something bad, but probably recoverable, has happened, so requeue the request

            if (statusCode === 429) {
                self._requestQueue.pause();
                var headerSecs = parseInt(headers['Retry-After'], 10);
                var headerMs = headerSecs * 1000;
                setTimeout(function() {
                    // Don't retry limit requests that were rejected due to retry-after
                    self.transport(args, handleTransportResponse);
                    self._requestQueue.resume();
                }, headerMs);

                self.emit(events.RATE_LIMITED, headerSecs);
            } else {
                //
                // If this is reached, it means an error outside the normal error logic was received. These should be very unusual as
                // standard errors come back with a 200 code and an "error" property.
                //
                // Given that, assume that something really weird happened and retry the request as normal.
                //

                var httpErr = new Error('Unable to process request, received abnormal ' + statusCode + ' error');
                if (retryOp.retry(httpErr)) {
                    return;
                } else {
                    cb(httpErr, null);
                }
            }

        } else {
            var parsedBody = parseAPIResponse(body);
            cb(null, parsedBody);
        }

        // This is always an empty callback, even if there's an error, as it's used to signal the
        // request queue that a request has completed processing, and nothing else.
        queueCb();
    };

    retryOp.attempt(function() {
        self.transport(args, handleTransportResponse);
    });

};


/**
 * Makes a call to the Slack API.
 *
 * @param {String} endpoint The API endpoint to send to.
 * @param {Object=} opt_data The data send to the Slack API.
 * @param {function} cb The callback to run on completion.
 */
WebAPIClient.prototype.makeAPICall = function(endpoint, opt_data, cb) {
    var args = {
        url: this.slackAPIUrl + endpoint,
        data: utils.getData(opt_data, this._token),
        headers: {
            'User-Agent': this.userAgent
        }
    };

    this._requestQueue.push({
        args: args,
        cb: cb
    });

};


module.exports = WebAPIClient;
