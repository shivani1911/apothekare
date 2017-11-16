'use strict';
const config = require("../config/config.js");
const nodemailer = require('nodemailer');
const Q = require("q");

const tStyle = "style='font-size:14pt;padding:4px 4px 4px 4px;border:2px solid black;'";
const tdStyle = "style='padding:4px 4px 4px 4px;border-bottom:2px solid grey;border-right:2px solid grey;'";

const customerTableStyle = "style='font-size:16pt;padding:4px 4px 4px 4px;width:100%;background-color:#dcdcdc;border: 1px solid black;'";
const customerTDStyle = tdStyle;

var path = require('path');
var EmailTemplate = require('email-templates').EmailTemplate;
var templatesDir = path.resolve(__dirname, '../templates');

var template = new EmailTemplate(path.join(templatesDir, 'receipt'));

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // secure:true for port 465, secure:false for port 587
    auth: {
        user: 'johnstestscripts@gmail.com',
        pass: 'Scrip!tes#!666'
    }
});

module.exports.send = function(customer, order) {
    var deferred = Q.defer();

    //TODO add customer to mailing list?
    var mailOptions = {
        from: config.mail.from, // sender address
        to: config.mail.to, // list of receivers
        subject: config.mail.subject, // Subject line
        //text: message // plain text body
        html: buildBody(customer, order)
    };

    transporter.sendMail(mailOptions, function(err, info) {
        if(err) {
            console.log(err);
            deferred.reject(err);
        } else {
            console.log('Message %s sent: %s', info.messageId, info.response);
            deferred.resolve(info);
        }
    });

    return deferred.promise;
};

module.exports.sendToCustomer = function(customer, order) {
    var deferred = Q.defer();

    var locals = {
        customer: customer,
        order: order
    };

    template.render(locals, function (err, results) {
        if (err) {
            return console.error(err);
        }

        var mailOptions = {
            from: config.mail.from, // sender address
            to: customer.email+",bhayek@gmail.com", // list of receivers
            subject: "Order "+order.hash+" Received", // Subject line
            text: results.text,
            html: results.html
        };

        transporter.sendMail(mailOptions, function(err, info) {
            if(err) {
                console.log(err);
                deferred.reject(err);
            } else {
                console.log('Message %s sent: %s', info.messageId, info.response);
                deferred.resolve(info);
            }
        });
    });

    return deferred.promise;
};

const buildBody = function(customer, order) {
    return "<table "+tStyle+">" +
        "<tr>"+
            "<td "+tdStyle+">Name</td><td "+tdStyle+">"+customer.firstname+" "+customer.lastname+"</td>"+
        "</tr><tr>"+
            "<td "+tdStyle+">Email</td><td "+tdStyle+">"+customer.email+"</td>"+
        "</tr><tr>"+
            "<td "+tdStyle+">Phone</td><td "+tdStyle+">"+customer.phone+"</td>"+
        "</tr><tr>"+
            "<td "+tdStyle+">Address</td><td "+tdStyle+">"+customer.address+"</td>"+
        "</tr><tr>"+
            "<td "+tdStyle+">City</td><td "+tdStyle+">"+customer.city+"</td>"+
        "</tr><tr>"+
            "<td "+tdStyle+">State</td><td "+tdStyle+">"+customer.state+"</td>"+
        "</tr><tr>"+
            "<td "+tdStyle+">ZIP</td><td "+tdStyle+">"+customer.zip+"</td>"+
        "</tr><tr>"+
            "<td "+tdStyle+">Estimated Total</td><td "+tdStyle+">$"+order.total+"</td>"+
        "</tr>"+
    "</table><br>"+
    "<a href='http://ec2-54-183-9-181.us-west-1.compute.amazonaws.com/confirm?orderId="+order.hash+"'>Confirm Order</a>"

};

const buildCustomerBody = function(customer, order) {
    var body = "<div><br><h1>Hello "+customer.firstname+"!</h1><p>Your order #"+order.hash+" has been received!</p><br>";
    body += "<table "+customerTableStyle+"><th>Details</th><th></th>";

    for(var i in order.items) {
        body += "<tr><td "+customerTDStyle+">"+order.items[i].name+"</td><td "+customerTDStyle+">"+order.items[i].price+"</td></tr>";
    }

    body += "<tr><td "+customerTDStyle+">Total</td><td "+customerTDStyle+">"+order.total+"</td></table></div>";

    return body;
};