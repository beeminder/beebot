var EventEmitter = require('events').EventEmitter;
var humps = require('humps');
var sinon = require('sinon');

var MemoryDataStore = require('../../lib/data-store').MemoryDataStore;
var RtmAPIClient = require('../../lib/clients/rtm/client');
var WebAPIClient = require('../../lib/clients/web/client');
var rtmStartFixture = require('../fixtures/rtm.start.json');

var fakeWs = function () {
    return new EventEmitter();
};


var getRtmClient = function () {
    var webClient;
    var rtmClient;
    webClient = new WebAPIClient('fake-token');
    rtmClient = new RtmAPIClient(webClient, fakeWs);
    sinon.stub(webClient.rtm, 'start', function (opts, cb) {
        cb(null, rtmStartFixture);
    });
    rtmClient.start();
    return rtmClient;
};


var getMemoryDataStore = function () {
    var dataStore = new MemoryDataStore();
    dataStore.cacheRtmStart(humps.camelizeKeys(rtmStartFixture));
    return dataStore;
};


module.exports.getMemoryDataStore = getMemoryDataStore;
module.exports.getRtmClient = getRtmClient;
