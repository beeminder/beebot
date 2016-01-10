# Node.js Slack Client Library

## Travis-CI Build Status

[![Build Status](https://travis-ci.org/slackhq/node-slack-client.png?branch=master)](https://travis-ci.org/slackhq/node-slack-client)

## Description

This is the Slack client library for node.js, it:
- wraps the [Slack Web API](https://api.slack.com/web) methods
- exposes the [Real Time Messaging API's](https://api.slack.com/rtm) functionality

## Installation

```bash
npm install slack-client --save
```

## Usage
```js

var WebClient = require('slack-client').WebClient;
var RtmClient = require('slack-client').RtmClient;

var token = '' || process.env.SLACK_API_TOKEN;

var webClient = new WebClient(token);
var rtm = new RtmClient(webClient, {logLevel: 'debug'});
rtm.start();

rtm.on('message', function(message) {
    console.log(message);
});

```

A full example of how to use this module from Node.js can be found in the [/examples directory](https://github.com/slackhq/node-slack-client/tree/master/examples).

## Contribute

Here's the most direct way to get your work merged into the project.

1. Fork the project
2. Clone down your fork
3. Create a feature branch
4. Hack away and add tests, not necessarily in that order
5. Make sure everything still passes by running tests
6. If necessary, rebase your commits into logical chunks without errors
7. Add yourself to package.json as a contributor
8. Push the branch up to your fork
9. Send a pull request for your branch

## Copyright

Copyright &copy; Slack Technologies, Inc. MIT License; see LICENSE for further details.


## v2.0.0 TODO
- add a retry policy to the web API
- handle and respect 429 responses in the web API
- update the remaining models to correctly pull out all properties
- figure out how data-store updates should handle updating objects where a richer object is already present, e.g. the self user is cached on RTM start and then a simplified version of the user object is received and overwrites it
- figure out how to make data-store methods async friendly, e.g. so that a redis data-store could be a thing
- improve the events emitted by the RTM api, e.g. errors etc.
- improve test coverage of the RTM Client API
