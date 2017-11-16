var mail = require("../lib/mail.js");

var customer = {firstname: "John", lastname: "Yates", email: "johnstestscripts@gmail.com", address: "4376 Corte al Fresco San Diego, CA", phone: "555-555-5555"};
var order = {hash: "1111111", total: 420, items: [{name: "Weed", price: 20}, {name: "Dank Weed", price: 400}]};

mail.sendToCustomer(customer, order);