/** tools **/

function testRegister() {
    $("#register input").val(makeid());
    $("#register").submit();
}

function testLogin() {
    $("#login input[name='email']").val("test@test.com");
    $("#login input[name='password']").val("test1234");
    $("#login").submit();
}

function testAdminLogin() {
    $("#login input[name='email']").val("admin@test.net");
    $("#login input[name='password']").val("test1234");
    $("#login").submit();
}

function testMenu() {
    $("#menuLink").click();
    try {
        assert($("#menu"), "visible");
    } catch(e) {
        alert("testMenu failed!");
    }
}

function testProfile() {

}

function testCart() {

}

function assert(el, condition) {
    if(condition == "visible") {
        if(el.css("display") == "none") {
            throw new Error;
        }
    }
}

function makeid() {
    var text = "";
    var possible = "0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}