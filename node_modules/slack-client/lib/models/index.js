module.exports = {
    Bot: require('./node-slack/bot'),
    Channel: require('./slack/channel'),
    DM: require('./slack/dm'),
    File: require('./slack/file'),
    Group: require('./slack/group'),
    MPDM: require('./slack/mpdm'),
    Team: require('./node-slack/team'),
    User: require('./slack/user'),
    UserGroup: require('./slack/user-group')
};
