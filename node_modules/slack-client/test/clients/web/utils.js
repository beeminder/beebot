var expect = require('chai').expect;

var utils = require('../../../lib/clients/web/utils');


describe('facets', function () {

    describe('utils', function () {

        describe('#getData', function () {
            it('merges the opts value into the top level data object and then removes opts', function () {
                var testData = {
                    channel: 'slack',
                    opts: {
                        count: 125
                    }
                };

                expect(utils.getData(testData, 'test')).to.be.deep.equal({
                    channel: 'slack',
                    count: 125,
                    token: 'test'
                });
            });

            it('prunes undefined and null values from the data object', function () {
                var testData = {
                    channel: 'slack',
                    opt_count: undefined
                };

                expect(utils.getData(testData, 'test')).to.be.deep.equal({
                    channel: 'slack',
                    token: 'test'
                });
            });
        });

    });

});
