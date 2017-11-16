const config = {};

if(process.env.env == "production") {
    config.mysql = {};
    //config.mysql.host = "xpressentry.cjwiqkmhnqds.us-west-1.rds.amazonaws.com";
    config.mysql.host = "driven.cjwiqkmhnqds.us-west-1.rds.amazonaws.com";
    config.mysql.user = "admin";
    //config.mysql.password = "uw8xi47j88cTuyE";
    config.mysql.password = "ax&!hakde$f&81o";
    //config.mysql.database = "apothekare";
    config.mysql.database = "driven";
    config.mysql.port = 3306;
    config.mysql.logging = false;
    config.mysql.dialect = "mysql";
    config.mysql.define = {timestamps: false};

    config.mail = {};
    config.mail.to = "johnstestscripts@gmail.com, bhayek@gmail.com";
    config.mail.from = 'johnstestscripts@gmail.com';
    config.mail.subject = "Order Received";

    config.getswift = {};
    config.getswift.apiKey = "f551232e-95a6-4470-b5f5-eed0feb54807";

    config.getswift.booking = {
        items: [],
        deliveryInstructions: "",
        itemsRequirePurchase: false,
        reference: "",
        dropoffDetail: {
            name : "",
            phone: "",
            address: "",
            description: "",
            additionalAddressDetails: {
                stateProvince: "CA",
                country: "United States",
                postcode: ""
            }
        },
        pickUpDetail: {
            name: "Apothekare",
            phone: "",
            email: "",
            description: "",
            address: "5125 Convoy Street",
            additionalAddressDetails: {
                stateProvince: "CA",
                country: "United States",
                postcode: 92111
            }
        }
    };
} else {
    config.mysql = {};
    config.mysql.host = "127.0.0.1";
    config.mysql.user = "root";
    config.mysql.password = "agicent";
    config.mysql.database = "apothekare";
    config.mysql.port = 3306;
    config.mysql.logging = false;
    config.mysql.dialect = "mysql";
    config.mysql.define = {timestamps: false};

    config.mail = {};
    config.mail.to = "johnstestscripts@gmail.com";
    config.mail.from = 'johnstestscripts@gmail.com';
    config.mail.subject = "Order Received";

    config.getswift = {};
    config.getswift.apiKey = "f551232e-95a6-4470-b5f5-eed0feb54807";

    config.getswift.booking = {
        items: [],
        deliveryInstructions: "",
        itemsRequirePurchase: false,
        reference: "",
        dropoffDetail: {
            name : "",
            phone: "",
            address: "",
            description: "",
            additionalAddressDetails: {
                stateProvince: "CA",
                country: "United States",
                postcode: ""
            }
        },
        pickUpDetail: {
            name: "Apothecare",
            phone: "",
            email: "",
            description: "",
            address: "5125 Convoy Street",
            additionalAddressDetails: {
                stateProvince: "CA",
                country: "United States",
                postcode: 92111
            }
        }
    };
}

module.exports = config;