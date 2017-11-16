const config = require("../config/config.js");
const crypto = require("crypto");
const Sequelize = require("sequelize");
const Q = require("q");
const maps = require("./maps.js");

const sql = new Sequelize(config.mysql.database, config.mysql.user, config.mysql.password,
    {host: config.mysql.host, dialect: "mysql", port: 3306, logging: false, define: {timestamps: false}});

const Dispensary = sql.define("dispensary", {
    name: Sequelize.STRING,
    address: Sequelize.STRING,
    city: Sequelize.STRING,
    state: Sequelize.STRING,
    zip: Sequelize.INTEGER,
    logo: Sequelize.STRING,
    coords: Sequelize.STRING,
    port: Sequelize.INTEGER
});

const Customers = sql.define('customer', {
    firstname: Sequelize.STRING,
    lastname: Sequelize.STRING,
    email: {type: Sequelize.STRING, unique: true},
    password: Sequelize.STRING,
    admin: Sequelize.INTEGER,
    phone: Sequelize.INTEGER,
    address: Sequelize.STRING,
    city: Sequelize.STRING,
    state: Sequelize.STRING,
    zip: Sequelize.INTEGER,
    testData: Sequelize.INTEGER,
    notes: Sequelize.STRING
});

const Orders = sql.define('order', {
    hash: Sequelize.STRING,
    customerId: Sequelize.INTEGER,
    dispensaryId: Sequelize.INTEGER,
    total: Sequelize.INTEGER,
    dispatched: Sequelize.INTEGER,
    testData: Sequelize.INTEGER,
    datetime: Sequelize.STRING,
    firstname: Sequelize.STRING,
    lastname: Sequelize.STRING,
    phone: Sequelize.STRING,
    address: Sequelize.STRING,
    city: Sequelize.STRING,
    state: Sequelize.STRING,
    zip: Sequelize.INTEGER
});

const OrderItems = sql.define("orderItem", {
    name: Sequelize.STRING,
    orderId: Sequelize.INTEGER,
    itemId: Sequelize.INTEGER,
    price: Sequelize.INTEGER,
    measure: Sequelize.STRING,
    quantity: Sequelize.STRING,
    testData: Sequelize.INTEGER
});

const Errors = sql.define("error", {
    datetime: Sequelize.STRING,
    customerId: Sequelize.INTEGER,
    content: Sequelize.STRING
});

Dispensary.hasMany(Orders);
Orders.hasMany(OrderItems);
Customers.hasMany(Orders);

const getOrders = function(query) {
    var deferred = Q.defer();

    Orders.findAll(query).then(function(orders) {
        console.log(orders);
        var output = [];

        for(var o in orders) {
            output.push(orders[o].dataValues);
        }

        deferred.resolve(output);
    }).catch(function(err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

const getOrdersByCustomer = function(customerId) {
    return getOrders({customerId: customerId});
};

const createOrder = function(order) {
    var deferred = Q.defer();

    order.hash = getOrderHash();

    Orders.build(order).save().then(function(saved) {
        var queue = [];
        saved.dataValues.items = order.items;
        for(var i in order.items) {
            queue.push(createOrderItem(saved.dataValues.id, order.items[i]));
        }

        Q.all(queue).then(function(result) {
            deferred.resolve(saved.dataValues);
        }).catch(function(err) {
            deferred.reject(err);
        })

    }).catch(function(err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

const createOrderItem = function(orderId, item) {
    var deferred = Q.defer();

    item.orderId = orderId;
    item.itemId = item.id;
    delete item.id;

    OrderItems.build(item).save().then(function(saved) {
        deferred.resolve(saved.dataValues);
    }).catch(function(err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

const getCustomer = function(query) {
    var deferred = Q.defer();

    Customers.findOne({where: query}).then(function(customer) {
        if(customer && customer.dataValues) {
            deferred.resolve(customer.dataValues);
        } else {
            deferred.reject("Could not find that user!");
        }
    }).catch(function(err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

const getCustomerByCreds = function(creds) {
    return getCustomer({email: creds.email, password: creds.password});
};

const getCustomerById = function(id) {
    return getCustomer({id: id});
};

const getCustomerByEmail = function(email) {
    return getCustomer({email: email});
};

const createCustomer = function(user) {
    var deferred = Q.defer();
    maps.verifyAddress(user.address, user.city, user.zip).then(function(valid) {
        getCustomerByEmail(user.email).then(function(customer) {
            deferred.reject("That email address is already in use.");
        }).catch(function(err) {
            Customers.create(user).then(function(customer) {
                deferred.resolve(customer.dataValues);
            }).catch(function(err) {
                deferred.reject(err);
            });
        });
    }).catch(function(err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

const getStagedOrders = function() {
    var deferred = Q.defer();

    var query = {
        where: {dispatched: 0},
        include: [
            {
                model: Customers,
                required: true,
                attributes: ["firstname", "lastname", "email", "address", "phone", "city", "state", "zip"]
            },
        ]
        //order: []
    };

    Orders.findAll(query).then(function(orders) {
        var gotOrders = [];
        for(var o in orders) {
            gotOrders.push(orders[o].dataValues);
        }

        deferred.resolve(gotOrders);
    }).catch(function(err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

const getStagedOrder = function(orderId) {
    var deferred = Q.defer();

    var query = {
        where: {hash: orderId, dispatched: 0},
        include: [
            {
                model: Customers,
                required: false,
                attributes: ["firstname", "lastname", "email", "address", "phone", "city", "state", "zip", "notes"]
            },
            {
                model: OrderItems,
                required: true,
                attributes: ["name", "price", "quantity"]
            }
        ]
    };

    Orders.findOne(query).then(function(order) {
        console.log(order && order.dataValues);
        if(order && order.dataValues) {
            deferred.resolve(order);
        } else {
            deferred.reject("No order found.");
        }
    }).catch(function(err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

const confirmOrder = function(hash, total) {
    var deferred = Q.defer();

    getStagedOrder(hash).then(function(order) {
        order.updateAttributes({dispatched: 1, total: total}).then(function() {
            deferred.resolve(order.dataValues);
        }).catch(function(err) {
            deferred.reject(err);
        });
    }).catch(function(err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

const getOrderByHash = function(hash) {
    var deferred = Q.defer();

    Orders.findOne({where: {hash: hash}, include: [Customers]}).then(function(order) {
        if(order && order.dataValues) {
            deferred.resolve(order.dataValues);
        } else {
            deferred.reject("Could not find order.");
        }
    }).catch(function(err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

const getDispensary = function(name) {
    var deferred = Q.defer();

    Dispensary.findOne({where: {name: name}}).then(function(config) {
        if(config && config.dataValues) {
            deferred.resolve(config.dataValues);
        } else {
            deferred.reject("Fatal: no configuration data found!");
        }
    }).catch(function(err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

const logError = function(err, customerId) {
    var error = {};
    error.customerId = customerId;
    error.content = err;

    Errors.build(error).save().catch(function(err) {
        console.log("Error logging failed!");
        console.log(err);
    });
};

const getOrderHash = function() {
    var str = getRandomString(6);
    return str.slice(0, 3) + "-" + str.slice(3);
};

const getRandomString = function(length){
    return crypto.randomBytes(Math.ceil(length/2))
        .toString('hex') /** convert to hexadecimal format */
        .slice(0,length);   /** return required number of characters */
};

Orders.belongsTo(Customers);
Customers.hasMany(Orders);

module.exports.getDispensary = getDispensary;

module.exports.Customers = Customers;
module.exports.Orders = Orders;
module.exports.OrderItems = OrderItems;

module.exports.createOrder = createOrder;
module.exports.getStagedOrders = getStagedOrders;
module.exports.getStagedOrder = getStagedOrder;
module.exports.confirmOrder = confirmOrder;
module.exports.getOrderByHash = getOrderByHash;

module.exports.getOrdersByCustomer = getOrdersByCustomer;

module.exports.getCustomer = getCustomer;
module.exports.getCustomerById = getCustomerById;
module.exports.getCustomerByCreds = getCustomerByCreds;
module.exports.getCustomerByEmail = getCustomerByEmail;

module.exports.createCustomer = createCustomer;

module.exports.logError = logError;