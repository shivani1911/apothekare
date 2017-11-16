const mocha = require("mocha");
//const chai = require("chai");
require('it-each')();
const Q = require("q");

const Client = require("node-rest-client").Client;
const db = require("../../lib/db.js");

const tools = require("../tools.js");

var client = new Client();

const adminCredentials = JSON.stringify({email: "admin@test.net", password: "test1234"});
const customerCredentials = JSON.stringify({email: "customer@test.net", password: "test1234"});

describe('Customers', function() {
    describe("should be able to", function() {
        it("login and receive a JWT", function(done) {
            tools.login(customerCredentials).then(function(response) {
                if(response.error === false && response.payload.jwt) {
                    done();
                } else {
                    done("Malformed or bad response!");
                }
            }).catch(function(err) {
                done(err);
            });
        });

        it("logout", function(done) {
            tools.logout().then(function(response) {
                if(response.error === false) {
                    done();
                } else {
                    done("Malformed or bad response!");
                }
            }).catch(function(err) {
                done(err);
            });
        });

        it("register", function(done) {
            var newCreds = {
                email: tools.getRandomString(5)+"@test.net",
                password: "test1234",
                address: "4376 Corte al Fresco",
                city: "San Diego",
                zip: 92130,
                phone: 5555555555,
                name: tools.getRandomString(5)
            };

            tools.register(JSON.stringify(newCreds)).then(function(response) {
                if(response.error === false) {
                    done();
                } else {
                    done("Malformed or bad response!");
                }
            }).catch(function(err) {
                done(err);
            });
        });
    });

    describe("should not be able to", function() {
        it("access admin methods", function(done) {
            tools.login(customerCredentials).then(function(response) {
                var args = {headers: {"Authorization": "Bearer "+response.payload.jwt}};
                client.get(tools.listOrdersRoute, args, function(data, response) {
                    if(data.error !== true) {
                        done("Should not have allowed access!");
                    } else {
                        done();
                    }
                });
            }).catch(function(err) {
                done(err);
            });
        });
    });
});

describe('Admins', function() {
    describe('should be able to', function() {
        it("login and receive a JWT", function(done) {
            tools.login(adminCredentials).then(function(response) {
                if(response.error === false && response.payload.jwt) {
                    done();
                } else {
                    done("Malformed or bad response!");
                }
            }).catch(function(err) {
                done(err);
            });
        });

        it("logout", function(done) {
            tools.logout().then(function(response) {
                if(response.error === false) {
                    done();
                } else {
                    done("Malformed or bad response!");
                }
            }).catch(function(err) {
                done(err);
            });
        });

        it('fetch orders from the API.', function(done) {
            tools.login(adminCredentials).then(function(response) {
                var args = {headers: {"Authorization": "Bearer "+response.payload.jwt}};
                client.get(tools.listOrdersRoute, args, function(data, response) {
                    if(data.error !== false) {
                        done(data.message);
                    } else {
                        for(var o in data.payload) {
                            if(!tools.checkOrder(data.payload[o])) {
                                throw new Error("Invalid or malformed order.");
                            }
                        }

                        done();
                    }
                });
            }).catch(function(err) {
                done(err);
            });
        });

        it('confirm staged orders for dispatch to GetSwift', function(done) {
            tools.login(adminCredentials).then(function(response) {
                var args = {headers: {"Authorization": "Bearer "+response.payload.jwt}};
                client.get(tools.listOrdersRoute, args, function(data, response) {
                    if(data.error !== false) {
                        done(data.message);
                    } else {
                        if(tools.checkOrder(data.payload[0])) {
                            args.data = {hash: data.payload[0].hash};
                            client.post(tools.confirmOrdersRoute, args, function(data, response) {
                                if(data.error) {
                                    done(data.error);
                                } else {
                                    done();
                                }
                            });
                        } else {
                            done("No orders to test on!");
                        }
                    }
                });
            }).catch(function(err) {
                done(err);
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