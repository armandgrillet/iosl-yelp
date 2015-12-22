/*jslint node: true */
'use strict';

var fs = require('fs');
var json2csv = require('json2csv');
var utils = require('../queries/utils');
var source = require("../../features/edinburgh.json");

function checkinfsForId(id, data) {
    for (var i = 0; i < data.rows.length; i++) {
        if (id == data.rows[i].business_id) {
            var checkins = 0;
            var unformattedCheckins = JSON.parse(data.rows[i].checkin_info);
            for (var key in unformattedCheckins) {
                checkins += unformattedCheckins[key];
            }
            return checkins;
        }
    }
    return 0;
}

function getBusinesses(city, category, callback) {
    utils.askDrill("SELECT table_business.business_id, table_checkin.checkin_info from " + utils.datasetPath('checkin') + " AS table_checkin INNER JOIN " + utils.datasetPath('business') + " AS table_business ON table_checkin.business_id = table_business.business_id WHERE table_business.city = '" + city + "' AND true=repeated_contains(table_business.categories,'" + category + "')", function(checkinsTable) {
        utils.askDrill("select business_id, name, total_checkins, stars, review_count, latitude, longitude from " + utils.datasetPath('business') + " WHERE city='" + city + "' AND true=repeated_contains(categories,'" + category + "')", function(secondAnswer) {
            var businesses = [];
            for (var i = 0; i < secondAnswer.rows.length; i++) {
                businesses.push({
                    'id': secondAnswer.rows[i].business_id,
                    'name': secondAnswer.rows[i].name,
                    'stars': secondAnswer.rows[i].stars,
                    'reviews': secondAnswer.rows[i].review_count,
                    'checkins': checkinfsForId(secondAnswer.rows[i].business_id, checkinsTable),
                    'latitude': secondAnswer.rows[i].latitude,
                    'longitude': secondAnswer.rows[i].longitude
                });
            }
            callback(addSuccess(businesses));
        });
    });
}

function getNumberOfFeaturesforRadius(business, radius, list) {
    var elementsInRadius = 0;
    for (var i = 0; i < list.length; i++) {
        if (utils.distance(list[i].lat, list[i].lon, business.latitude, business.longitude) <= radius) {
            elementsInRadius++;
        }
    }
    return elementsInRadius;
}

function addSuccess(businesses) {
    var averageCheckins = 0;
    var averageStars = 0;
    var averageReviews = 0;
    var businessesWithSuccess = [];
    var maxCheckins = 0,
        maxStars = 0,
        maxReviews = 0;

    // Calculating the mean of checkin, stars and review count of a business category
    for (var i = 0; i < businesses.length; i++) {
        averageCheckins += parseFloat(businesses[i].checkins);
        averageStars += parseFloat(businesses[i].stars);
        averageReviews += parseFloat(businesses[i].reviews);
    }
    averageCheckins /= businesses.length;
    averageStars /= businesses.length;
    averageReviews /= businesses.length;

    // Normalizing the values
    for (i = 0; i < businesses.length; i++) {
        if (parseFloat(businesses[i].checkins) > parseFloat(maxCheckins)) {
            maxCheckins = parseFloat(businesses[i].checkins);
        }
        if (parseFloat(businesses[i].stars) > parseFloat(maxStars)) {
            maxStars = parseFloat(businesses[i].stars);
        }
        if (parseFloat(businesses[i].reviews) > maxReviews) {
            maxReviews = parseFloat(businesses[i].reviews);
        }
    }

    for (i = 0; i < businesses.length; i++) {
        businessesWithSuccess.push({
            'name': businesses[i].name,
            'latitude': businesses[i].latitude,
            'longitude': businesses[i].longitude,
            'success': ((parseFloat(businesses[i].checkins / maxCheckins) + parseFloat(businesses[i].stars / maxStars) + parseFloat(businesses[i].reviews / maxReviews)) / 3)
        });
    }
    return businessesWithSuccess;
}

getBusinesses('Edinburgh', 'Bars', function(businesses) {
    var fields = ['name', 'success'].concat(source.types);
    var rows = [];

    var row;
    var type;
    for (var i = 0; i < businesses.length; i++) {
        row = {
            "name": businesses[i].name,
            "success": businesses[i].success
        };
        for (var j = 2; j < fields.length; j++) {
            row[fields[j]] = getNumberOfFeaturesforRadius(businesses[i], 200, source[fields[j]]);
        }
        rows.push(row);
    }

    json2csv({
        data: rows,
        fields: fields
    }, function(err, csv) {
        if (err) console.log(err);
        fs.writeFile('Bars.csv', csv, function(err) {
            if (err)
                throw err;
            console.log('file saved');
        });
    });
});