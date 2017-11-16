const Q = require("q");
const Client = require("node-rest-client").Client;
var client = new Client();
const crypto = require("crypto");
const db = require("../lib/db.js");

const login = function(credentials) {
    var deferred = Q.defer();
    var args = {data: credentials, headers: {"Content-type": "application/json"}};
    client.post("http://localhost:3000/login", args, function(data, response) {
        if(data.error) {
            deferred.reject(data.error);
        } else {
            deferred.resolve(data);
        }
    });

    return deferred.promise;
};

const logout = function() {
    var deferred = Q.defer();
    client.post("http://localhost:3000/logout", {}, function(data, response) {
        if(data.error) {
            deferred.reject(data.error);
        } else {
            deferred.resolve(data);
        }
    });

    return deferred.promise;
};

const register = function(user) {
    var deferred = Q.defer();
    var args = {data: user, headers: {"Content-type": "application/json"}};
    client.post("http://localhost:3000/customers", args, function(data, response) {
        if(data.error) {
            deferred.reject(data.message);
        } else {
            deferred.resolve(data);
        }
    });

    return deferred.promise;
};

const getRandomString = function(length){
    return crypto.randomBytes(Math.ceil(length/2))
        .toString('hex') /** convert to hexadecimal format */
        .slice(0,length);   /** return required number of characters */
};

const checkOrder = function(order) {
    return (order.id && order.hash && order.total && order.customerId && order.customer);
};

const cleanUpTestData = function() {
    var deferred = Q.defer();
    var testDataQ = {where: {testData: 1}};

    db.OrderItems.destroy(testDataQ).then(function() {
        db.Orders.destroy(testDataQ).then(function() {
            db.Customers.destroy(testDataQ).then(function() {
                deferred.resolve(true);
            }).catch(function(err) {
                deferred.reject(err);
            });
        }).catch(function(err) {
            deferred.reject(err);
        });
    }).catch(function(err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

module.exports.ordersRoute = "http://localhost:3000/orders";
module.exports.confirmOrdersRoute = "http://localhost:3000/admin/orders/confirm";
module.exports.listOrdersRoute = "http://localhost:3000/admin/orders";

module.exports.login = login;
module.exports.logout = logout;
module.exports.register = register;
module.exports.getRandomString = getRandomString;
module.exports.checkOrder = checkOrder;
module.exports.cleanUpTestData = cleanUpTestData;