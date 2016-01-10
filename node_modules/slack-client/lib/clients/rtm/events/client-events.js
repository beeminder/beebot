/**
 * Client specific events.
 * NOTE: These are only dispatched by v2.0.0 of the client and higher.
 */

module.exports = {
    CONNECTING: 'connecting',
    AUTHENTICATED: 'authenticated',
    FAILED_AUTHENTICATION: 'failed_auth',
    OPENED_RTM_CONNECTION: 'open',
    OPENING_WEBSOCKET: 'opening_ws',
    OPENED_WEBSOCKET: 'opened_ws',
    WS_CLOSE: 'ws_close',
    ATTEMPTING_RECONNECT: 'attempting_reconn',
    RAW_MESSAGE: 'raw_message'
};
