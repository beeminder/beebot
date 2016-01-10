var expect = require('chai').expect;

var clientHelpers = require('../../lib/clients/helpers');


describe('Client Helpers', function() {
    describe('#parseAPIResponse()', function () {
        it('should process a JSON encoded string, converting it to JSON with camel-cased keys', function () {
            var testMsg = {
                "ok": true,
                "reply_to": 1,
                "ts": "1355517523.000005",
                "text": "Hello world"
            };
            var message = clientHelpers.parseAPIResponse(JSON.stringify(testMsg));

            expect(message).to.deep.equal({
                ok: true,
                replyTo: 1,
                ts: "1355517523.000005",
                text: "Hello world"
            });
        });
    });

});
