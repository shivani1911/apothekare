var user = {};
var order = {};

$(document).ready(function(e) {

    /** Authenticate User **/
    if($.cookie("jwt")) {
        user.jwt = $.cookie("jwt");
        secureAjaxJSONRequest("/authenticate", "GET", {}, loginSucceed, failSilently);
    }

    /** Load Order Table **/
    secureAjaxJSONRequest("/admin/orders", "GET", {}, buildOrderTable, errorDialog);

    /** Go to Confirm Modal after Review **/
    $("#confirmOrder").on("click", function(e) {
        e.preventDefault();

        $("#confirm_hash").text($("#hash").val());
        $("#confirm_email").text($("#email").val());
        $("#confirm_phone").text($("#phone").val());
        $("#confirm_firstname").text($("#firstname").val());
        $("#confirm_lastname").text($("#lastname").val());
        $("#confirm_address").text($("#address").val());
        $("#confirm_city").text($("#city").val());
        $("#confirm_state").text($("#state").val());
        $("#confirm_zip").text($("#zip").val());
        $("#confirm_notes").text($("#notes").val());

        $("#confirm_total").text($("#total").val());

        $("#reviewOrderModal").modal("hide");
        $("#confirmOrderModal").modal("show");
    });

    $("#logout").click(function(e) {
        logout();
        window.location = "/";
    });

    /** Submit Order for Delivery **/
    $("#deliverOrder").click(function(e) {
        e.preventDefault();

        /** Hotfix, very bad and take out ASAP **/
        var order = {
            hash: $("#confirm_hash").text(),
            email: $("#confirm_email").text(),
            phone: $("#confirm_phone").text(),
            firstname: $("#confirm_firstname").text(),
            lastname: $("#confirm_lastname").text(),
            address: $("#confirm_address").text(),
            city: $("#confirm_city").text(),
            state: $("#confirm_state").text(),
            zip: $("#confirm_zip").text(),
            notes: $("confirm_notes").text(),
            total: $("#confirm_total").text()
        };

        /** End hotfix **/

        $("#confirmOrderModal").modal("hide");
        $("#reviewOrderModal").modal("hide");
        order.autoConfirm = true;
        secureAjaxJSONRequest("/admin/orders", "POST", order, confirmSucceed, confirmFail);
    });

    /** Enter new Phone Order **/
    $("#newPhoneOrder").click(function(e) {
        $("#phoneOrderModal").modal("show");
    });

    /** Review Order after Entering **/
    $("#newOrderForm").submit(function(e) {
        e.preventDefault();
        $("#confirmOrderModal").modal("show");
        $("#phoneOrderModal").modal("hide");

        $("#newOrderForm input").each(function(i, el) {
            $("#confirm_"+$(el).attr("name")).text($(el).val());
        });
    });
});

function confirmFetchSucceed(data) {
    for(var f in data.customer) {
        $("#"+f).val(data.customer[f]).show(200);
    }

    $("#orderReviewItemsTable tbody").empty();

    for(var i in data.orderItems) {
        $("#orderReviewItemsTable").append("<tr><td>"+data.orderItems[i].quantity+"</td><td class='overflow:hidden;'>"+data.orderItems[i].name+"</td><td>$"+data.orderItems[i].price+"</td></tr>")
    }

    $("#hash").val(data.hash);
    $("#total").val(data.total);
    $("#reviewOrderModal").modal("show");
}

function confirmSucceed() {
    $("#successModal").modal("show");
    $("#orderConfirm input").each(function(i, el) {
        if($(el).attr("type") != "submit") {
            $(el).val("");
        }
    });

    $("#orderReviewItemsTable tbody").empty();


    $("#orders tbody").empty();
    $(".orderLink").off("click");

    secureAjaxJSONRequest("/admin/orders", "GET", {}, buildOrderTable, errorDialog);
}

function confirmFetchFail(err) {
    $("#orderConfirm input").not("#hash").each(function(i, el) {
        if($(el).attr("type") != "submit") {
            $(el).val("").hide(100);
        }
    });

    $("#orderConfirmItemsTable tbody").empty();

    //errorDialog(err);
}

function confirmFail(err) {
    errorDialog(err);
}

function buildOrderTable(orders) {
    for(var o in orders) {
        $("#orders tbody").append(buildOrderRow(orders[o]));
    }

    $(".orderLink").click(function(e) {
        e.preventDefault();
        fetchOrder($(this).data("hash"));
    });
}

function buildOrderRow(order) {
    return '<tr id="'+order.hash+'" class="order">'+buildHashCell(order.hash)+buildNameCell(order.customer)+buildTimeCell(order.datetime)+'</tr>'
}

function buildHashCell(hash) {
    return '<td class="hashCell"><button class="btn btn-default orderLink" data-hash="'+hash+'">'+hash+'</button></td>';
}

function buildNameCell(customer) {
    return '<td class="nameCell">'+customer.firstname+' '+customer.lastname+'</td>';
}

function buildTimeCell(datetime) {
    var date = new Date(datetime);
    var time = date.toLocaleTimeString("en-US");
    var day = (date.getMonth()+1)+"/"+date.getDate()+"/"+(date.getYear()+1900);
    return '<td class="timeCell">'+day+' '+time+'</td>';
}

function fetchOrder(hash) {
    secureAjaxJSONRequest("/admin/orders/"+hash, "GET", {}, confirmFetchSucceed, confirmFetchFail);
}

function createOrderSucceed() {
    $("#successModal").modal("show");
    $("#newOrderForm input").each(function(i, el) {
        $(el).val("");
    });
}

function createOrderFail(err) {
    errorDialog(err);
}

function logout() {
    ajaxJSONRequest("/logout", "POST", {}, logoutSucceed, errorDialog);
}