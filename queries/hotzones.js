var utils = require('./utils');
var grid_example = require('./grid_example');

function getCheckinsByBusinessId(city, callback) {
    utils.askDrill("SELECT table_checkin.business_id,table_checkin.checkin_info from " + utils.datasetPath('checkin') + " AS table_checkin INNER JOIN " + utils.datasetPath('business') + " AS table_business ON table_checkin.business_id = table_business.business_id WHERE table_business.city = '" + city + "'", function(answer) {
        console.log(answer);
        callback(answer.rows);
    });
}

// var to be used in 2 functions so they're put here as global
var sum = 0; // number of checkins for one business
var min_value = 0; // minimum number of checkins per business
var max_value = 0; // maximum number of checkins per business
var total_sum = 0; // total number of checkins in every business of the city

module.exports = {
    get: function(parameters, callback) {
        getCheckinsByBusinessId(parameters.city, function(businesses) {

            for (var i = 0; i < businesses.length; i++) {
                sum[businesses[i].business_id] = 0;
                checkin = JSON.parse(businesses[i].checkin_info);
                for (var key in checkin) {
                    sum[businesses[i].business_id] += checkin[key];
                }
                if (sum[businesses[i].business_id] > max_value)
                    max_value = sum[businesses[i].business_id];
                if (sum[businesses[i].business_id] < min_value)
                    min_value = sum[businesses[i].business_id];
                total_sum += sum[businesses[i].business_id];
            }

            utils.getGrid(parameters.city, function(grid) {
                var gridPolygons = [];
                var ratioCheckins = []; // number of checkins per grid[][] divided by total number of checkins
                var ratioMax;
                var ratioMin;

                // ratioMin and ratioMax are initialized to the value of the first grid[][]
                for (var count = 0; count < grid[0][0].business_ids.length; count++) {
                    ratioMax += sum[business_ids[count]] / total_sum;
                }
                ratioMin = ratioMax;

                // browsing the grid
                for (i = 0; i < grid.length; i++) { // 0.001° = 111.32 m
                    ratioCheckins[i] = [];
                    for (j = 0; j < grid[i].length; j++) {
                        if (grid[i][j].business_ids.length >= 2) { // There is at least 2 businesses in the area.
                            for (var k = 0; k < grid[i][j].business_ids.length; k++) {
                                ratioCheckins[i][j] += sum[grid[i][j].business_ids[k]] / total_sum;
                            }
                            if (ratioCheckins[i][j] > ratioMax)
                                ratioMax = ratioCheckins[i][j];
                            if (ratioCheckins[i][j] < ratioMin)
                                ratioMin = ratioCheckins[i][j];

                            gridPolygons.push({
                                points: grid[i][j].points,
                                popup: grid[i][j].business_ids.length.toString(),
                                options: {
                                    fill: true,
                                    fillColor: "#FF0000",
                                    fillOpacity: (ratioCheckins[i][j] - ratioMin) / ratioMax //normalization of the value so that it will be between 0 and 1
                                }
                            });
                        }
                    }
                }
                var answer = {
                    polygons: gridPolygons
                };
                console.log(answer);
                callback(answer);
            });
        });
    },
    test: function() {
        console.log('Test not yet implemented');
    }
};