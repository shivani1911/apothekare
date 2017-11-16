function formToJson(id) {
    var fields = $(id).serializeArray();
    var form = {};

    for(var f in fields) {
        form[fields[f].name] = fields[f].value;
    }

    return form;
}

function parseField(field) {
    if(field) {
        return field;
    } else {
        return "---";
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function toTitleCase(str) {
    var splitStr = str.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
        // You do not need to check if i is larger than splitStr length, as your for does that for you
        // Assign it back to the array
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    // Directly return the joined string
    return splitStr.join(' ');
}

function ajaxJSONRequest(url, method, data, successHandler, failHandler) {
    $.ajax({
        url: url,
        method: method,
        data: JSON.stringify(data),
        headers: {
            "Content-type": "application/json"
        }
    }).done(function(data, jqXHR, textStatus) {
        if(data.error) {
            failHandler(data.message);
        } else {
            successHandler(data.payload);
        }
    }).fail(function(jqXHR, textStatus, err) {
        failHandler(err);
    });
}

function secureAjaxJSONRequest(url, method, data, successHandler, failHandler) {
    $.ajax({
        url: url,
        method: method,
        data: JSON.stringify(data),
        headers: {
            "Content-type": "application/json",
            "Authorization" : "Bearer "+user.jwt
        }
    }).done(function(data, jqXHR, textStatus) {
        if(data.error == true) {
            failHandler(data.message);
        } else {
            successHandler(data.payload);
        }
    }).fail(function(jqXHR, textStatus, err) {
        failHandler(err);
    });
}

function externalSONRequest(url, method, data, successHandler, failHandler) {
    $.ajax({
        url: url,
        method: method,
        data: JSON.stringify(data),
        headers: {
            "Content-type": "application/json"
        }
    }).done(function(data, jqXHR, textStatus) {
        if(data.error) {
            failHandler(data.message);
        } else {
            successHandler(data);
        }
    }).fail(function(jqXHR, textStatus, err) {
        failHandler(err);
    });
}

function buildWeedmapsMenuURL(name) {
    return "https://api.weedmaps.com/api/web/v1/listings/"+name+"/menu?type=dispensary";
}