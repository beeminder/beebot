/**
 * Simple websocket transport using the ws library.
 */

var WebSocket = require('ws');


var wsTransport = function (socketUrl) {
    return new WebSocket(socketUrl);
};

module.exports = wsTransport;
