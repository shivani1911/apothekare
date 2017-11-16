var Q = require("q");
const Client = require("node-rest-client").Client;
const config = require("../config/config.js");
var client = new Client();

module.exports.send = function(order) {
    var deferred = Q.defer();

    var booking = JSON.parse(JSON.stringify(config.getswift.booking));

    for(var i in order.orderItems) {
        booking.items.push({
            quantity: order.orderItems[i].dataValues.quantity,
            description: order.orderItems[i].dataValues.name,
            price: order.orderItems[i].dataValues.price
        });
    }

    booking.reference = order.hash;

    if(order.customer) {
        booking.dropoffDetail.name = order.customer.dataValues.firstname +" "+ order.customer.dataValues.lastname;
        booking.dropoffDetail.phone = order.customer.dataValues.phone;
        booking.dropoffDetail.address = order.customer.dataValues.address +" "+order.customer.dataValues.city;
        booking.dropoffDetail.additionalAddressDetails.postcode = order.customer.dataValues.zip;
        booking.dropoffDetail.additionalAddressDetails.stateProvince = order.customer.dataValues.state;
        booking.deliveryInstructions = order.customer.dataValues.notes;
    } else {
        booking.dropoffDetail.name = order.firstname+" "+order.lastname;
        booking.dropoffDetail.phone = order.phone;
        booking.dropoffDetail.address = order.address;
        booking.dropoffDetail.additionalAddressDetails.postcode = order.zip;
        booking.dropoffDetail.additionalAddressDetails.stateProvince = order.state;
        booking.deliveryInstructions = order.notes;
    }

    console.log(booking);

    var payload = JSON.stringify({apiKey: config.getswift.apiKey, booking: booking});

    client.post("https://app.getswift.co/api/v2/deliveries",
        {
            data: payload,
            headers: {"Content-type": "application/json"}
        }, function(data, response) {
            deferred.resolve(data);
    });

    return deferred.promise;
};