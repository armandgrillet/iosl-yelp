var map;
var markers;
var cities = {
    'Pittsburgh': {
        latitude: 40.440625,
        longitude: -79.995886
    },
    'Charlotte': {
        latitude: 35.227087,
        longitude: -80.843127
    },
    'Urbana-Champaign': {
        latitude: 40.110588,
        longitude: -88.207270
    },
    'Phoenix': {
        latitude: 33.448377,
        longitude: -112.074037
    },
    'Las Vegas': {
        latitude: 36.169941,
        longitude: -115.139830
    },
    'Madison': {
        latitude: 43.073052,
        longitude: -89.401230
    },
    'Montreal': {
        latitude: 45.501689,
        longitude: -73.567256
    },
    'Karlsruhe': {
        latitude: 49.006890,
        longitude: 8.403653
    },
    'Edinburgh': {
        latitude: 55.953252,
        longitude: -3.188267
    },
};

window.onload = function() {
    map = L.map('map').setView([cities.Phoenix.latitude, cities.Phoenix.longitude], 15);
    markers = new L.FeatureGroup().addTo(map);

    // Downloading the map layer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 10,
        maxZoom: 18,
        attribution: '© <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map);

    $('#run-request').on('click', function() {
        var request = $('#request').val();
        var query = {};
        query.latitude = map.getCenter().lat;
        query.longitude = map.getCenter().lng;

        query.city = getNearestCity(query.latitude, query.longitude);
        if (request.indexOf('?') > -1) {
            query.algorithm = request.substr(0, request.indexOf('?'));

            var otherParameters = request.substring(request.indexOf('?') + 1).split('&');
            for (var i = 0; i < otherParameters.length; i++) {
                var parameter = otherParameters[i].split('=');
                query[parameter[0]] = parameter[1];
            }
        } else {
            query.algorithm = request;
        }

        if (query.algorithm === undefined) {
            console.log('Query is not correct');
        } else {
            get(query);
        }
    });

    $('.radio').on('change', function() {
        moveTo($("input[name='optionsRadios']:checked").val());
    });
};

function display(data) {
    if (data.error !== undefined) {
        console.log(data.error);
    } else {
        var position, poup; // Position and popup of an element.
        var i; // Loop to go through the elements.
        if (data.position !== undefined) {
            console.log(data.position);
            map.panTo(new L.LatLng(data.position.latitude, data.position.longitude));
            if (data.position.zoom !== undefined) {
                map.setZoom(data.position.zoom);
            }
        }
        if (data.markers !== undefined) {
            var markers = data.markers;
            for (i = 0; i < markers.length; i++) {
                var markerParameters = markers[i];
                position = {
                    latitude: markerParameters.latitude,
                    longitude: markerParameters.longitude
                };
                delete markerParameters.latitude;
                delete markerParameters.latitude;

                if (markerParameters.popup !== '') {
                    popup = markerParameters.popup;
                    delete markerParameters.popup;
                    var marker = L.marker([position.latitude, position.longitude], markerParameters.options).addTo(map);
                    marker.bindPopup(popup);
                } else {
                    L.marker([position.latitude, position.longitude], markerParameters.options).addTo(map);
                }
            }
        }

        if (data.circles !== undefined) {
            var circles = data.circles;
            for (i = 0; i < circles.length; i++) {
                var circleParameters = circles[i];
                position = {
                    latitude: circleParameters.latitude,
                    longitude: circleParameters.longitude
                };
                delete circleParameters.latitude;
                delete circleParameters.latitude;

                var radius = circleParameters.radius;
                delete circleParameters.radius;

                if (circleParameters.popup !== '') {
                    popup = circleParameters.popup;
                    delete circleParameters.popup;
                    var circle = L.circle([position.latitude, position.longitude], radius, circleParameters.options).addTo(map);
                    circle.bindPopup(popup);
                } else {
                    L.marker([position.latitude, position.longitude], radius, circleParameters.options).addTo(map);
                }
            }
        }

        if (data.polygons !== undefined) {
            var polygons = data.polygons;
            for (i = 0; i < polygons.length; i++) {
                var polygonParameters = polygons[i];
                var points = [];
                for (var j = 0; j < polygonParameters.points.length; j++) {
                    points.push([polygonParameters.points[j].latitude, polygonParameters.points[j].longitude]);
                }
                delete polygonParameters.points;

                if (polygonParameters.popup !== '') {
                    popup = polygonParameters.popup;
                    delete polygonParameters.popup;
                    var polygon = L.polygon(points, polygonParameters.options).addTo(map);
                    polygon.bindPopup(polygonParameters.popup);
                } else {
                    L.polygon(points, polygonParameters.options).addTo(map);
                }
            }
        }
    }
}

function distance(lat1, lon1, lat2, lon2) {
    var radlat1 = Math.PI * lat1 / 180;
    var radlat2 = Math.PI * lat2 / 180;
    var radlon1 = Math.PI * lon1 / 180;
    var radlon2 = Math.PI * lon2 / 180;
    var theta = lon1 - lon2;
    var radtheta = Math.PI * theta / 180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    return dist;
}

function get(query) {
    $.get('/mapquery', query, function(data) {
        display(data);
    });
}

function getNearestCity(latitude, longitude) {
    var nearestCity, smallestDistance;
    for (var city in cities) {
        var distanceForCity = distance(latitude, longitude, cities[city].latitude, cities[city].longitude);
        if (smallestDistance === undefined || smallestDistance > distanceForCity) {
            nearestCity = city;
            smallestDistance = distanceForCity;
        }
    }
    return nearestCity;
}

function moveTo(city) {
    if (cities[city] !== undefined) {
        map.panTo(new L.LatLng(cities[city].latitude, cities[city].longitude));
    } else {
        console.log('City is not in the Yelp dataset');
    }
}