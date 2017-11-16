var cartTotal = 0;
var cartItems = {};
var user = {};

var dispatchIcon = '<span class="glyphicon glyphicon-circle-arrow-right"></span>';
var removeIcon = '<span class="glyphicon glyphicon-remove"></span>';
//var itemDropDown = '<input class="quantitySelector" type="number" step="1" value="1" min="1">';

$(document).ready(function() {
    getMenu();
    authenticate();
    loadLogo();

    $("#over18Button").click(function(e) {
        e.preventDefault();
        $(".ageCheck").show(200);
        $(".preAgeCheck").hide(200);
        showTab($("#menu"));
    });

    $("#under18Button").click(function(e) {
        e.preventDefault();
        window.location = "http://www.apothekare.com";
    });

    $(".removeButton").click(function(e) {
        e.preventDefault();
        removeFromCart($(this));
    });

    $("#cartForm").submit(function(e) {
        e.preventDefault();
        if(user.jwt) {
            $("#confirmOrderName").text(user.firstname+" "+user.lastname);
            $("#confirmOrderAddress").text("Address: "+user.address +" "+user.city+", "+user.state +" "+user.zip);
            $("#confirmOrderPhone").text("Phone: "+user.phone);
            buildConfirmOrderTable();
            $("#confirmOrderModal").modal("show");
        } else {
           $("#registerOrLoginModal").modal("show");
        }
    });

    $("#confirmOrderButton").click(function(e) {
        e.preventDefault();
        if(user && user.phone && user.address) {
            processOrder();
        } else {
            errorDialog("Please log in to order!");
        }
    });

    $("#login").submit(function(e) {
        e.preventDefault();
        validateForm($(this), function() {
            login();
        });
    });

    $("#logout").click(function(e) {
        logout();
    });

    $("#register").submit(function(e) {
        e.preventDefault();
        validateForm($(this), function() {
            register();
        });
    });

    $("#profile").submit(function(e) {
        e.preventDefault();
        validateForm($(this), function() {
            secureAjaxJSONRequest("/customers", "PUT", formToJson("#user"), successDialog, errorDialog);
        });
    });

    $("#demo").click(function(e) {
        $("#demoModal").modal("show");
    });

    $("#demoFormSubmit").click(function(e) {
        e.preventDefault();
        rebuildMenu($("#demoName").val().toLowerCase().replace(" ", "-"));
    });

    //$("#myOrdersLink").click(function(e) {
    //    secureAjaxJSONRequest("/orders", "GET", {}, orderFetchSucceed, errorDialog);
    //});

    //$("#orderReview_hash").change(function() {
    //    secureAjaxJSONRequest("/admin/orders/"+$(this).val(), "GET", {}, orderFetchSucceed, errorDialog);
    //});

    $("#orderReview").submit(function(e) {
        e.preventDefault();
        secureAjaxJSONRequest("/admin/orders", "POST", formToJson("#orderReview"), adminOrderSucceed, errorDialog);
    });

    $("#finishButton").click(function(e) {
        cartTotal = 0;
        cartItems = {};
        $("#cartNumber").text("0");
        $("#checkout").attr("disabled", true);
        $("#cartTable tbody").empty();
        $("#confirmOrderTable tbody").empty();
        $("#reviewOrderTable tbody").empty();
        $("#cartTotal").text("$0.00");
        $("#cartCumulativeTotal").text("$0.00");
    });

    if($(window).width() < 768) {
        $(".itemRow").click(function(e) {
            addToCart($(this));
        });
    }

});

function authenticate() {
    if($.cookie("jwt")) {
        user.jwt = $.cookie("jwt");
        secureAjaxJSONRequest("/authenticate", "GET", {}, loginSucceed, authenticateFail);
    } else {
        $(".preAgeCheck").slideDown(500);
    }
}

function login() {
    ajaxJSONRequest("/login", "POST", formToJson("#login"), loginSucceed, errorDialog);
}

function logout() {
    ajaxJSONRequest("/logout", "POST", {}, logoutSucceed, errorDialog);
}

function processOrder() {
    var order = formToJson("#order");
    order.items = cartItems;
    order.total = cartTotal;
    $("#confirmOrderTable").hide(200);
    $("#confirmOrderLoader").show(200);
    secureAjaxJSONRequest("/orders", "POST", order, orderSucceed, errorDialog);
}

function register() {
    ajaxJSONRequest("/register", "POST", formToJson("#register"), registerSucceed, errorDialog);
}

function getMenu() {
    externalSONRequest(buildWeedmapsMenuURL(vendor), "GET", {}, buildMenu, errorDialog);
}

function loadLogo() {
    var img = '<img class="img-responsive" src="'+logo+'"></img>';
    $("#mainBranding").append(img);
}

function rebuildMenu(dispensaryName) {
    $("#menu").empty();
    externalSONRequest(buildWeedmapsMenuURL(dispensaryName), "GET", {}, buildMenu, errorDialog);
}

function buildMenu(data) {
    $.each(data.categories, function(index, category) {
        buildCategory(category);
    });
}

function buildCategory(category) {
    //menu.append(createCategoryBar(category)).append(createCategoryTable(category));

    $(createCategoryBar(category)).appendTo(menu).slideDown(1000);
    menu.append(createCategoryTable(category));

    $("#"+category.title+"Bar").click(function(e) {
        //$(".menuBar").css("position", "static");
        //$(this).css("position", "fixed");
        $("#" + category.title).slideToggle(500);
        $("#" + category.title+ "Caret").toggleClass("glyphicon-menu-right").toggleClass("glyphicon-menu-down");
    });

    $.each(category.items, function(index, item) {
        buildItem(item);
    });
}

function buildItem(item) {
    $("#"+item.category_name+" table").append(buildMeasureItem(item));
}

function buildMeasureItem(item) {
    var json = JSON.stringify(item.prices);
    var lowest = findLowestPrice(item.prices);

    var row = "<tr id='"+item.id+"' class='itemRow measureRow' data-name='"+item.name+"' data-prices='"+json+"' onClick='addToCart(this)'>"
    +'<td><img class="itemImage" src="'+item.image_url+'"></td>'
    +'<td>'+item.name+'<p class="hidden-lg hidden-md font-half">Starting at $'+lowest+'</p></td>';

    //Iterate prices and display
    var fill = 7 - Object.keys(item.prices).length;

    //Prefill unused tds
    while(fill > 0) {
        row += '<td class="hidden-xs">- - -</td>';
        fill--;
    }

    for(var p in item.prices) {
        row += '<td class="hidden-xs itemCell"><span>$'+item.prices[p]+'</span></td>';
    }

    row += '<td class="hidden-xs">'+parseField(item.thc_test_result)+'%</td>'
    +'<td class="hidden-xs">'+parseField(item.cbd_test_result)+'%</td>'
    +'<td class="hidden-xs">'+parseField(item.cbn_test_result)+'%</td>'
    +'<td class="addToCart" onClick="addToCart(this.parentNode)"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></td>'
    +'</tr>';

    return row;
}

function findLowestPrice(json) {
    var lowest = null;
    for(var i in json) {
        if(lowest == null) {
            lowest = json[i];
        }

        if(json[i] < lowest && json[i] > 0) {
            lowest = json[i];
        }
    }

    return lowest;
}

function addToCart(el) {
    var item = {name: $(el).data("name"), id: $(el).attr("id"), prices: $(el).data("prices")};
    confirmOrder(item);
}

function removeFromCart(el) {
    var parent = $(el).parent("tr");
    var total = parent.data("quantity") * parent.data("price");
    delete cartItems[parent.data("id")];
    cartTotal -= total;
    $("#cartTotal").text("$"+cartTotal+".00");
    $("#cartCumulativeTotal").text("$"+cartTotal+".00");
    $("#cartNumber").text(Object.keys(cartItems).length);
    $(el).parent().slideUp(500).remove();
}

function confirmOrder(item) {
    $("#confirmItemModal .modal-body").empty();
    $(".purchasePanel").off("click");

    for(var p in item.prices) {
        appendPricePanel(item, p);
    }

    $("#activeItemName").text("Purchase "+item.name);
    $("#confirmItemModal").modal("show");
}

function appendPricePanel(item, p) {
    var id = item.id+p;
    var formatted = toTitleCase(p.replace("_", " "));

    $("#confirmItemModal .modal-body").append(
        '<div id="'+id+'" class="panel panel-default purchasePanel" data-price="'+item.prices[p]+'" data-quantity="'+p+'">' +
        '<div class="panel-body"><span class="navbar-brand">'+formatted+'</span><span class="priceText">$'+item.prices[p]+'</span></div>'+
        '</div>');

    $("#"+id).click(function(e) {
        item.measure = formatted;
        item.price = item.prices[p];
        updateCart(item);
    });
}

function updateCart(item) {
    var id = item.id+item.measure;
    id = id.replace(" ", "");

    if(cartItems[id]) {
        cartItems[id].quantity += 1;
    } else {
        item.quantity = 1;
        cartItems[id] = item;
    }

    var price = cartItems[id].price * cartItems[id].quantity;

    if(item.price && !isNaN(item.price)) {
        cartTotal += item.price
    } else {
        price = "---";
    }

    $("#cartNumber").text(Object.keys(cartItems).length);

    $("#confirmItemModal").modal("hide");
    $("#cartTotal").text("$"+cartTotal+".00");
    $("#cartCumulativeTotal").text("$"+cartTotal+".00");

    $("#"+id).remove();

    $("#cartTable").append(buildCartRow(id, price, item));

    $("#"+id+"Quantity").change(function(e) {
        if($(this).val() > 1) {
            changeItemQuantity($(this).val(), id);
        } else {
            $(this).val(1);
        }
    });

    $("#checkout").attr("disabled", false);
}

function changeItemQuantity(quantity, id) {
    cartTotal -= cartItems[id].quantity * cartItems[id].price;
    cartItems[id].quantity = quantity;
    $("tr[data-id='"+id+"']").data("quantity", quantity);
    cartTotal += cartItems[id].quantity * cartItems[id].price;
    $("#cartTotal").text("$"+cartTotal+".00");
    $("#cartCumulativeTotal").text("$"+cartTotal+".00");
    $("#"+id+"Price").text("$"+cartItems[id].quantity*cartItems[id].price+".00");
}

function persistCart(item) {
    var cookieCart = $.cookie("cart");

    if(!cookieCart) {
        cookieCart = {};
    }

    cookieCart[item.id] = item;

    $.cookie("cart", cookieCart);
}

function getOrderReview(orderId) {
    secureAjaxJSONRequest("/admin/orders/"+orderId, "GET", {}, buildOrderReview, errorDialog);
}

function buildOrderReview(orders) {
    for(var o in orders) {
        $("#orderReviewForm").append(buildOrderRow(orders[o]));
    }

    $(".dispatchOrder").click(function(e) {
        dispatchOrderConfirm($(this).parent().attr("id"));
    });
}

function buildOrderRow(order) {
    return "<tr id='"+order.hash+"' data-name='"+order.customer.name+"' class='orderReviewRow'><td>"+order.customer.name+"</td><td>"+order.hash+"</td><td>$"+order.total+"</td><td class='dispatchOrder'>"+dispatchIcon+"</td></tr>";
}

function dispatchOrderConfirm(orderId) {
    $("#dispatchOrderText").text("Confirm and dispatch order "+orderId+"?");
    $("#dispatchConfirmModal").modal("show");
    $("#dispatchButton").off("click").click(function(e) {
         dispatchOrder(orderId);
    });
}

function dispatchOrder(orderId) {
    secureAjaxJSONRequest("/admin/orders/confirm", "POST", {hash: orderId}, dispatchSucceed, dispatchFail);
}

function validateForm(form, callback) {
    var inputs = form.find(".form-control");
    var invalids = 0;
    console.log(inputs);
    for(var i in inputs) {
        var input = inputs[i];
        if(input.required) {
            if(input.value == "") {
                $(input).parents(".form-group").addClass(".has-warning");
            } else {
                $(input).parents(".form-group").removeClass(".has-warning");
            }
        }
    }

    console.log(invalids+" Invalid");

    if(invalids == 0) {
        callback();
    }


}