const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const crypto = require("crypto");
const expressJWT = require('express-jwt');
const jwt = require("jsonwebtoken");

/** Libs **/
const db = require("./lib/db.js");
const maps = require("./lib/maps.js");
const mail = require("./lib/mail.js");
const getswift = require("./lib/getswift.js");

/** Globals **/
const jwtSecret = 'asduf8udas8g9d@@*(Asa!!8d9as';
var initVals = {};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(expressJWT({secret: jwtSecret}).unless({path: [
    '/', '/login', '/register', '/logout', '/confirm', '/dispensary/'
]}));

app.set('views', './public/view');
app.set('view engine', 'ejs');

const hashPassword = function(password) {
    var salt = "ayaf7d8afda2f2938hfhajf92";
    var hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    return hash.digest("hex");
};

app.get("/", function(req, res, next) {
    res.render('index.ejs', {vendor: initVals.name, logo: initVals.logo});
    next();
});

app.get("/admin/confirm/:orderId", function(req, res, next) {
    db.getOrderByHash(req.params.orderId).then(function(order) {
        res.render({order: order});
    }).catch(function(err) {
         handleError(req, res, err);
    });
});

app.post("/login", function(req, res, next) {
    var where = {};
    where.email = req.body.email;
    where.password = hashPassword(req.body.password);

    db.getCustomerByCreds(where).then(function(customer) {
        customer.jwt = jwt.sign({id: customer.id, email: customer.email, admin: customer.admin}, jwtSecret);
        customer = cleanForUI(customer);
        res.json({error: false, message: "Logged in.", payload: customer});
        next();
    }).catch(function(err) {
        handleError(req, res, err);
        next();
    });
});

app.post("/logout", function(req, res, next) {
    res.json({error: false, message: "Logged out."});
    next();
});

app.get("/authenticate", function(req, res, next) {
    if(req.user) {
        db.getCustomerByEmail(req.user.email).then(function(customer) {
            customer.jwt = jwt.sign({id: customer.id, email: customer.email, admin: customer.admin}, jwtSecret);
            customer = cleanForUI(customer);
            res.json({error: false, message: "Authenticated.", payload: customer});
            next();
        }).catch(function(err) {
            handleError(req, res, err);
            next();
        });
    } else {
        handleError(req, res, "You are not authorized to perform that action.");
        next();
    }
});

app.post("/register", function(req, res, next) {
    req.body.password = hashPassword(req.body.password);

    db.createCustomer(req.body).then(function(customer) {
        customer.jwt = jwt.sign({id: customer.id, email: customer.email, admin: customer.admin}, jwtSecret);
        customer = cleanForUI(customer);
        res.json({error: false, message: "Signed up.", payload: customer});
        next();
    }).catch(function(err) {
        handleError(req, res, err);
        next();
    });
});

app.put("/customers", function(req, res, next) {
    var update = {};
    var fields = [];

    for(var f in req.body) {
        if(req.body[f] != "") {
            update[f] = req.body[f];
            fields.push(f);
        }
    }

    req.body.id = req.user.id;

    maps.verifyAddress(update.address, update.city, update.zip).then(function(valid) {
        db.Customers.update(update, {where: {email: update.email}, fields: fields}).then(function (customer) {
            res.json({error: false, message: "Updated.", payload: customer});
            next();
        }).catch(function (err) {
            handleError(req, res, err);
            next();
        });
    }).catch(function(err) {
        handleError(req, res, "There was a problem verifying your address. Please ensure it is correct!");
        next();
    });
});

app.get("/orders", function(req, res, next) {
    db.getOrdersByCustomer(req.user.id).then(function(orders) {
        res.json({error: false, message: "Orders retrieved.", payload: orders});
    }).catch(function(err) {
        handleError(req, res, err);
        next();
    });
});

app.post("/orders", function(req, res, next) {
    db.getCustomerById(req.user.id).then(function(customer) {
        req.body.customerId = customer.id;
        req.body.dispensaryId = initVals.id;
        db.createOrder(req.body).then(function(order) {
            req.body.id = order.id;
            mail.send(customer, order).then(function() {
                mail.sendToCustomer(customer, order).then(function() {
                    res.json({error: false, message: "Order saved.", payload: order});
                    next();
                }).catch(function(err) {
                    handleError(req, res, err);
                    next();
                });
            }).catch(function(err) {
                handleError(req, res, err);
                next();
            });
        }).catch(function(err) {
            handleError(req, res, err);
            next();
        });
    }).catch(function(err) {
        handleError(req, res, err);
        next();
    });
});

app.get("/confirm", function(req, res, next) {
    res.render("confirm.ejs", {orderId: req.query.orderId});
});

app.get("/admin/orders/:id", function(req, res, next) {
    if(req.user.admin) {
        db.getStagedOrder(req.params.id).then(function(order) {
            res.json({error: false, message: "Order retrieved.", payload: order});
            next();
        }).catch(function(err) {
            handleError(req, res, err);
            next();
        });
    } else {
        handleError(req, res,"You are not authorized to perform that action.");
        next();
    }
});

app.get("/admin/orders", function(req, res, next) {
    if(req.user.admin) {
        db.getStagedOrders().then(function(orders) {
            res.json({error: false, message: "Orders retrieved.", payload: orders});
            next();
        }).catch(function(err) {
            handleError(req, res, err);
            next();
        });
    } else {
        handleError(req, res, "You are not authorized to perform that action.");
        next();
    }
});

app.post("/admin/orders", function(req, res, next) {
    if(req.user.admin) {
        if(req.body.hash) {
            db.confirmOrder(req.body.hash, req.body.total).then(function(order) {
                getswift.send(order).then(function(response) {
                    res.json({error: false, message: "Order confirmed.", payload: {id: req.body.hash}});
                    next();
                }).catch(function(err) {
                    handleError(req, res, err);
                    next();
                });
            }).catch(function(err) {
                handleError(req, res, err);
                next();
            })
        } else {
            //maps.verifyAddress(req.body.address, req.body.city, req.body.zip).then(function(valid) {
            req.body.dispatched = 1;
            db.createOrder(req.body).then(function(order) {
                getswift.send(req.body).then(function(response) {
                    res.json({error: false, message: "Order sent."});
                }).catch(function(err) {
                    handleError(req, res, err);
                    next();
                });
            }).catch(function(err) {
                handleError(req, res, err);
                next();
            });
            //}).catch(function(err) {
            //    handleError(req, res, err);
            //    next();
            //});
        }
    } else {
        handleError(req, res, "You are not authorized to perform that action.");
        next();
    }
});

app.post("/admin/orders/confirm", function(req, res, next) {
    if(req.user.admin) {
        db.confirmOrder(req.body.hash, req.body.total).then(function(order) {
            getswift.send(order).then(function(response) {
                res.json({error: false, message: "Order confirmed.", payload: {id: req.body.hash}});
                next();
            }).catch(function(err) {
                handleError(req, res, err);
                next();
            });
        }).catch(function(err) {
            handleError(req, res, err);
            next();
        });
    } else {
        handleError(req, res, "You are not authorized to perform that action.");
        next();
    }
});

db.getDispensary(process.env.client).then(function(config) {
    initVals = config;
    app.listen(initVals.port, function () {
        console.log('Driven server for '+initVals.name+' listening on port '+initVals.port+'!');
    });
}).catch(function(err) {
    console.log(err);
});

function cleanForUI(body) {
    delete body.id;
    delete body.password;
    delete body.customerId;
    delete body.testData;
    delete body.signUp;
    return body;
}

function handleError(req, res, err) {
    console.log(err);

    if(typeof err == "object") {
        if(req.user && req.user.id) {
            db.logError(err.stack, req.user.id);
        } else {
            db.logError(err.stack, null)
        }

        if(err.message) {
            err = err.message;
        } else {
            err = "Unable to complete the the requested action.";
        }
    }

    res.json({error: true, message: err});
}