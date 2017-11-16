const Client = require("node-rest-client").Client;
var client = new Client();
const db = require("../../lib/db.js");
const mocha = require("mocha");
require('it-each')();
const Q = require("q");
const tools = require("../tools.js");

/** Globals **/
const ordersRoute = "http://localhost:3000/orders";
const adminCredentials = JSON.stringify({email: "admin@test.net", password: "test1234"});

var orders = [
    {
        name: "Test User",
        customerId: 1,
        phone: "8585555555",
        address: "4376 Corte al Fresco",
        city: "San Diego",
        testData: 1,
        zip: "92130",
        signUp: true,
        email: tools.getRandomString(10)+"@test.net",
        password: "test1234",
        total: 100,
        items: [
            {id: 111, price: 30, testData: 1},
            {id: 222, price: 40, testData: 1},
            {id: 333, price: 60, testData: 1},
            {id: 444, price: 80, testData: 1}
        ]
    },
    {
        name: "Test User",
        customerId: 1,
        phone: "8585555555",
        address: "4376 Corte al Fresco",
        city: "San Diego",
        testData: 1,
        zip: "92130",
        signUp: true,
        email: tools.getRandomString(10)+"@test.net",
        password: "test1234",
        total: 420,
        items: [
            {id: 111, price: 30, testData: 1},
            {id: 222, price: 40, testData: 1},
            {id: 333, price: 60, testData: 1},
            {id: 444, price: 80, testData: 1}
        ]
    }
];

var badOrders = [
    {
        name: "Test User",
        customerId: 1,
        phone: "8585555555",
        address: "123 Fake Street",
        city: "San Diego",
        testData: 1,
        zip: "92130",
        total: 100,
        items: [
            {id: 111, price: 30, testData: 1},
            {id: 222, price: 40, testData: 1},
            {id: 333, price: 60, testData: 1},
            {id: 444, price: 80, testData: 1}
        ]
    },
    {
        name: "Test User",
        customerId: 1,
        phone: "8585555555",
        address: "123 Fake Street",
        city: "San Diego",
        testData: 1,
        zip: "92130",
        total: 420,
        items: [
            {id: 111, price: 30, testData: 1},
            {id: 222, price: 40, testData: 1},
            {id: 333, price: 60, testData: 1},
            {id: 444, price: 80, testData: 1}
        ]
    }
];

const verifyOrder = function(orderId) {
    var deferred = Q.defer();

    db.Orders.findOne({where: {id: orderId}}).then(function(order) {
        deferred.resolve(order);
    }).catch(function(err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

describe('Orders', function() {
    describe('created with DB methods ', function() {
        it.each(orders, 'should save without errors', function(order, next) {
            db.createOrder(order)
                .then(verifyOrder)
                .then(function(order) {
                    next();
                }).catch(function(err) {
                    next(err);
                });
        });
    });

    describe('sent to API', function() {
        this.timeout(4000);
        it.each(orders, 'should save without errors', function(order, next) {
            tools.login(adminCredentials).then(function(response) {
                var args = {
                    data: JSON.stringify(order),
                    headers: {"Content-type": "application/json", "Authorization" : "Bearer "+response.payload.jwt}
                };

                client.post(tools.ordersRoute, args, function(data, response) {
                    if(data.error !== false) {
                        next(data.error);
                    } else {
                        next();
                    }
                });
            }).catch(function(err) {
                next(err);
            });
        });
    });
});

describe('Invalid Orders', function() {
    describe('sent to API', function() {
        it.each(badOrders, 'should fail to save with errors', function(order, next) {
            client.post(tools.ordersRoute, {data: JSON.stringify(order), headers: {"Content-type": "application/json"}}, function(data, response) {
                if(data.error !== false) {
                    next(data.error);
                } else {
                    next();
                }
            });
        });
    });
});


describe("Test Data", function() {
    it("should be cleaned up", function(done) {
        tools.cleanUpTestData().then(function() {
            done();
        }).catch(function(err) {
            done(err);
        })
    });
});