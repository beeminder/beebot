/**
 *
 * @param opts
 * @constructor
 */

var bind = require('lodash').bind;
var inherits = require('inherits');
var ws = require('ws');


var MockWSServer = function(opts) {
    ws.Server.call(this, opts);

    this.on('connection', function (newWs) {
        newWs.send(JSON.stringify({type: 'hello'}));
        newWs.on('message', this.handleMessage);
    });
};

inherits(MockWSServer, ws.Server);


MockWSServer.prototype.handleMessage = function(message) {
};


MockWSServer.prototype.makeClosingWSS = function() {
    // respond to the test message by closing the socket
    var closeWS = function (message) {
        message = JSON.parse(message);
        if (message.type === 'close_socket') {
            this.clients[0].close();
        }
    };
    this.handleMessage = bind(closeWS, this);
};


module.exports = MockWSServer;
