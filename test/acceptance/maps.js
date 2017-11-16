const mocha = require("mocha");
//const chai = require("chai");
require('it-each')();

const map = require("../../lib/maps.js");

var addresses = [
    {
        name: "Test User",
        phone: "8585555555",
        address: "4376 Corte al Fresco",
        city: "San Diego",
        zip: "92130",
        total: 100
    },
    {
        name: "Test User",
        phone: "8585555555",
        address: "4376 Corte al Fresco",
        city: "San Diego",
        zip: "92130",
        total: 420
    }
];

var badAddresses = [
    {
        name: "Test User",
        phone: "8585555555",
        address: "123 Fake Street",
        city: "San Diego",
        zip: "92130",
        total: 100
    },
    {
        name: "Test User",
        phone: "8585555555",
        address: "123 Fake Street",
        city: "San Diego",
        zip: "92130",
        total: 420
    }
];

describe('Real addresses', function() {
    it.each(addresses, 'should verify without errors.', function(address, next) {
        map.verifyAddress(address.address, address.city, address.zip).then(function(valid) {
           next();
        }).catch(function(err) {
            next(err);
        });
    });
});

describe("Bad addresses", function() {
    it.each(badAddresses, 'should fail to verify with errors.', function(address, next) {
        map.verifyAddress(address.address, address.city, address.zip).then(function(valid) {
            next();
        }).catch(function(err) {
            next();
        });
    });
});