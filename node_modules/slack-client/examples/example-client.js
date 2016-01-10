/**
 * Example for creating and working with the Slack RTM API.
 */

var WebClient = require('../lib/clients/web/client');
var RtmClient = require('../lib/clients/rtm/client');

var token = '' || process.env.SLACK_API_TOKEN;

var webClient = new WebClient(token);
var rtm = new RtmClient(webClient, {logLevel: 'debug'});
rtm.start();

rtm.on('message', function(message) {
    console.log(message);
});
