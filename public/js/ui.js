var activeTab, cartTable, menu, cart, orderReview;

//Before load, detect if user is logged in
if($.cookie("jwt")) {
    showTab($("#menu"));
} else {
    showTab($("#home"));
}

$(document).ready(function() {
    var tel = $("input[type='tel']");
    var email = $("input[name='email']");

    //Elements
    activeTab = $("#home");
    cartTable = $("#cartTable");
    menu = $("#menu");
    cart = $("#cart");
    orderReview = $("#orderReview");

    //Bindings
    $(".link").click(function(e) {
        showTab($("#"+$(this).data("tab")));
    });

    $(".modalBtn").click(function(e) {
        $("#"+$(this).data("modal")+"Modal").modal("show");
    });

    $("#register").click(function(e) {
        $("#registerModal").modal("show");
    });

    /** Phone Mask **/
    tel.mask("(999) 999-9999");

    tel.on("blur", function() {
        var last = $(this).val().substr( $(this).val().indexOf("-") + 1 );

        if(last.length == 3 ) {
            var move = $(this).val().substr($(this).val().indexOf("-") - 1, 1);
            var lastfour = move + last;
            var first = $(this).val().substr( 0, 9 );

            $(this).val(first + '-' + lastfour);
        }
    });
});

function showTab(tab) {
    if(!tab.hasClass("activeTab")) {
        hideTab($('.activeTab'));
        tab.slideToggle(500).addClass("activeTab").removeClass("inactiveTab");
    }
}

function hideTab(tab) {
    tab.slideToggle(500).removeClass("activeTab").addClass("inactiveTab");
}

function adminUI() {
    $(".adminUI").show(500);
    authUI();
}

function authUI() {
    $("#loginModal").modal("hide");
    $("#registerModal").modal("hide");
    $(".nonAuthUI").hide();
    $(".preAgeCheck").slideUp(500);
    $(".authUI").show(500);
    $(".ageCheck").show(500);
    $(".preAgeCheck").hide(500);

    if(!user.admin) {
        if(cartTotal != null || cartTotal != undefined) {
            if(cartTotal > 0 && Object.keys(cartItems).length > 0) {
                showTab(cart);
            } else {
                showTab(menu);
            }
        }
    }
}

function failSilently(err) {

}

function loginSucceed(data) {
    user = data;
    userAuthenticated();
}

function logoutSucceed() {
    user = {};
    $.removeCookie("jwt");
    showTab($("#home"));
    nonAuthUI();
    $(".preAgeCheck").show(200);
    $(".ageCheck").hide(200);
}

function orderSucceed(order) {
    $("#confirmOrderModal").modal("hide");
    $("#orderConfirmationHeader").text("Order "+order.hash+" Confirmed!");
    $("#confirmOrderLoader").hide(200);
    showOrderConfirmation(order);
    showTab(menu);
}

function nonAuthUI() {
    $(".authUI").hide(500);
    $(".adminUI").hide(500);
    $(".nonAuthUI").show(500);
}

function registerSucceed(data) {
    user = data;
    userAuthenticated();
    $("#registerModal").modal("hide");
    $("#successModalText").text("You have successfully signed up!");
    $("#successModal").modal("show");
}

function successDialog(message) {
    //$("#successModalText").text(message);
    $("#successModal").modal("show");
}

function errorDialog(err) {
    $("#errorModalText").text(err);
    $("#errorModal").modal("show");
}

function dispatchSucceed(data) {
    $("#"+data.id).fadeOut(500);
}

function authenticateFail(err) {
    $(".preAgeCheck").slideDown(500);
}

function orderFetchSucceed(orders) {
    for(var o in orders) {

        $("#myOrdersTable tbody").append(
            "<tr><td>"+orders[o].hash+"</td>"+
                "<td>"+new Date(orders[o].datetime).toLocaleString()+"</td>"+
                "<td></td><td>"+orders[o].total+"</td></tr>"
        );
    }
}

function adminOrderSucceed(data) {

}

function userAuthenticated() {
    $.cookie("jwt", user.jwt, {expires: 99});

    for(var f in user) {
        $("#user [name='"+f+"']").val(user[f]);
        $("#order [name='"+f+"']").val(user[f]);
    }

    $("#profileLinkText").text(user.firstname+" "+user.lastname);

    if(user.admin) {
        if(window.location.href.indexOf("confirm") < 0) {
            window.location = "/confirm";
        } else {
            adminUI();
        }
    } else {
        authUI();
    }
}

function showOrderConfirmation(order) {
    $("#cartNumber").text("0");
    $("#finishModal").modal("show");
}

function buildConfirmOrderTable() {
    var total = 0;

    var tbody = $("#confirmOrderTable tbody");
    var tbody2 = $("#reviewOrderTable tbody");
    tbody.empty();

    for(var item in cartItems) {
        var row = buildItemRow(cartItems[item]);
        tbody.append(row);
        tbody2.append(row);
        total += cartItems[item].price * cartItems[item].quantity;
    }

    if(total != cartTotal) {
        errorDialog("Calculated totals did not match!");
    }

    tbody.append("<tr><td></td><td></td><td></td></tr>");
    tbody.append("<tr><td></td><td>Estimated Total:</td><td>$"+total+".00</td></tr>");
    tbody2.append("<tr><td></td><td></td><td></td></tr>");
    tbody2.append("<tr><td></td><td>Estimated Total:</td><td>$"+total+".00</td></tr>");
}

function buildItemRow(item) {
    var price;

    if(item.price && !isNaN(item.price)) {
        price = "$"+item.price+".00";
    } else {
        price = "---";
    }

    return "<tr class='itemRow' class='hide''><td>"+item.quantity+"</td><td>"+item.name+"</td><td>"+price+"</td></tr>";
}

function createCategoryBar(category) {
    return '<div id="'+category.title+'Bar" class="menuBar panel panel-default" data-menu="'+category.title+'" style="display:none;">'
            +'<div class="panel-body">'
                +'<span id="'+category.title+'Caret" class="menuCaret glyphicon glyphicon-menu-right"></span>'
                +'<span style="float:right">'+category.title+'</span>'
            +'</div>'
        +'</div>'
}

function createCategoryTable(category) {
    return '<div id="'+category.title+'" class="col-xl-12 menu">'
            +'<table class="table menuTable">'
                +'<th class="hidden-xs"></th><th class="hidden-xs"></th><th class=hidden-xs><img src="/img/half_gram.png"></th>'
                +'<th class="hidden-xs"><img src="/img/gram.png"></th><th class="hidden-xs"><img src="/img/two_grams.png"></th><th class=hidden-xs><img src="/img/eighth.png"></th>'
                +'<th class="hidden-xs"><img src="/img/quarter.png"></th><th class="hidden-xs"><img src="/img/half_ounce.png"></th><th class="hidden-xs"><img src="/img/ounce.png"></th>'
                +'<th class="hidden-xs"><img src="/img/thc.png"></th><th class="hidden-xs"><img src="/img/cbd.png"></th><th class="hidden-xs"><img src="/img/cbn.png"></th><th class="hidden-xs"></th>'
            +'</table>' +
        '</div>'
}

function createQuantitySelector(id, item) {
    return '<input id="'+id+'Quantity" type="number" min="1" max="99" value="'+item.quantity+'">';
}

function buildCartRow(id, price, item) {
    if($(window).width() < 400) {
        return '<tr style="font-size:50%;" id="'+id+'" data-price="'+price+'" data-id="'+id+'" data-measure="'+item.measure+'" data-quantity="'+item.quantity+'">' +
            '<td>'+createQuantitySelector(id, cartItems[id])+'</td><td style="overflow:hide;white-space:nowrap;">'+item.name+' '+item.measure+'</td><td id="'+id+'Price">$'+price+'.00</td>' +
            '<td class="removeButton" onClick="removeFromCart(this)">'+removeIcon+'</td></tr>';
    } else {
        return '<tr id="'+id+'" data-price="'+price+'" data-id="'+id+'" data-measure="'+item.measure+'" data-quantity="'+item.quantity+'">' +
            '<td>'+createQuantitySelector(id, cartItems[id])+'</td><td>'+item.name+' '+item.measure+'</td><td id="'+id+'Price">$'+price+'.00</td>' +
            '<td class="removeButton" onClick="removeFromCart(this)">'+removeIcon+'</td></tr>';
    }
}