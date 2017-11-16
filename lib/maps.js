const client = require('@google/maps').createClient({
    key: 'AIzaSyD44S3kM5pY8Tae-uz5c6YCd-F7gABvSi0'
});

const Q = require("q");

module.exports.verifyAddress = function(address, city, zip) {
    var deferred = Q.defer();

    if(address && city && zip) {
        client.geocode({address: address+" "+city+", CA "+zip}, function(err, response) {
            if(err) {
                deferred.reject(err);
            } else {
                console.log(response.json.results);
                if(response.json.results.length < 1 || response.json.results[0].partial_match == true) {
                    deferred.reject("Address could not be verified.");
                } else {
                    deferred.resolve(true);
                }
            }
        });
    } else {
        deferred.reject("Please provide Address, City and ZIP code to verify address.");
    }

    return deferred.promise;
};