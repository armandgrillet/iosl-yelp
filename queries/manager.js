/*jslint node: true */
'use strict';

var businesses = require('./businesses');
var example = require('./example');
var grid_example = require('./grid_example');
var features = require('./features');
var hotgrid = require('./hotgrid');
var hotspots = require('./hotspots');
var hotzones = require('./hotzones');
var info = require('./info');
var success = require('./success');

module.exports = {
    do: function(algorithm, parameters, callback) {
        switch (algorithm) {
            case 'businesses':
                businesses.get(parameters, callback);
                break;
            case 'example':
                example.get(parameters, callback);
                break;
            case 'features':
                features.get(parameters, callback);
                break;
            case 'hotspots':
                hotspots.get(parameters, callback);
                break;
            case 'grid_example':
                grid_example.get(parameters, callback);
                break;
            case 'hotgrid':
                hotgrid.get(parameters, callback);
                break;
            case 'hotzones':
                hotzones.get(parameters, callback);
                break;
            case 'info':
                info.get(parameters, callback);
                break;
            case 'success':
                success.get(parameters, callback);
                break;
            default:
                callback({
                    error: 'Query does not exist'
                });
        }
    },
    test: function(algorithm) {
        switch (algorithm) {
            case 'businesses':
                businesses.test();
                break;
            case 'example':
                example.test(); // For the tests we don't use parameters, we directly modify the file containing the algorithm.
                break;
            case 'hotspots':
                hotspots.test();
                break;
            case 'hotgrid':
                hotgrid.test();
                break;
            case 'hotzones':
                hotzones.test();
                break;
            case 'info':
                info.test();
                break;
            case 'success':
                success.test();
                break;
            default:
                console.log('This algorithm does not exist');
        }
    }
};
