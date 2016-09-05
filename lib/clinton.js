var handleMessage = function(rtm, message) {
  var regex = /(donald|trump|hillary|clinton)/ig;
  if (regex.exec(message.text) != null) {
    rtm.send({
      id: 1,
      type: "message",
      channel: message.channel,
      text: "P(Clinton) = https://uhbezd9gve.execute-api.us-west-2.amazonaws.com/prod/clinton (TODO: fetch it directly)"
    });
  }
}


module.exports = {
  handleMessage: handleMessage
}
