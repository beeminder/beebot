/**
 * Legacy client implementation mirroring the 1.x.x Slack client implementations.
 */

var inherits = require('inherits');

var WebClient = require('slack-client').WebClient;
var RtmClient = require('slack-client').RtmClient;


var LegacyRTMClient = function(slackToken, autoReconnect, autoMark) {
    var webClient = new WebClient(slackToken);
    var opts = {
        autoReconnect: autoReconnect,
        autoMark: autoMark
    };
    RtmClient.call(this, webClient, opts);
};

inherits(LegacyRTMClient, RtmClient);
