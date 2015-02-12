﻿/// <reference path="../definitelytyped/angularjs/angular.d.ts" />

var ap = angular.module('AzurePing', []);

ap.controller('AzurePingCtrl', [
    '$scope', '$http', '$timeout',
    function ($scope, $http, $timeout) {
        $scope.datacentres = [
            //USA
            { location: 'Central USA (Iowa)', url: 'centralusa' },
            { location: 'North Central USA (Chicago, Illinois)', url: 'northcentralusa' },
            { location: 'South Central USA (San Antonio, Texas)', url: 'southcentralusa' },
            { location: 'West USA (California)', url: 'westusa' },
            { location: 'East USA (Boydton, Virginia)', url: 'eastusa' },
            //Rest of Americas
            { location: 'South Brazil (Sao Paulo)', url: 'southbrazil' },
            //Asia
            { location: 'East Asia (Hong Kong, China)', url: 'eastasia' },
            { location: 'South East Asia (Singapore)', url: 'southeastasia' },
            { location: 'East Japan (Saitama)', url: 'eastjapan' },
            { location: 'West Japan (Osaka)', url: 'westjapan' },
            //Europe
            { location: 'North Europe (Dublin, Ireland)', url: 'northeurope' },
            { location: 'West Europe (Amsterdam, Netherlands)', url: 'westeurope' },
            //Oceania
            { location: 'East Australia (Sydney)', url: 'eastaustralia' },
            { location: 'South East Australia (Melbourne)', url: 'southeastaustralia' }
        ];

        var getUrl = function (datacentreUrl, excludeJson) {
            return 'http://' + datacentreUrl + '-azure.azurewebsites.net/Tiny.ashx' + (excludeJson ? '' : '?callback=JSON_CALLBACK');
        };
        var execute = function (datacentreUrl) {
            return $http.jsonp(getUrl(datacentreUrl), { cache: false, timeout: 10000 });
        };
        var getTime = function () {
            return new Date().getTime();
        };
        var doesSupportPerformanceApi = function () {
            return !!(window.performance && window.performance.getEntries);
        };
        var getMostPreciseTime = function (url, lowResolutionTime) {
            if (!doesSupportPerformanceApi()) {
                return lowResolutionTime;
            }

            var fullUrlPrefix = getUrl(url, true);
            var thisUrlReadings = window.performance.getEntries().filter(function (val) {
                return val.name.indexOf(fullUrlPrefix) === 0;
            });
            if (thisUrlReadings === 0) {
                return lowResolutionTime;
            }
            var thisUrlMostRecentReading = thisUrlReadings[thisUrlReadings.length - 1];
            if (!thisUrlMostRecentReading.duration) {
                return lowResolutionTime;
            }

            return Math.round(thisUrlMostRecentReading.duration);
        };

        $scope.supportsPerformanceApi = doesSupportPerformanceApi();

        //warm up server on page load
        var warmupServers = function () {
            return angular.forEach($scope.datacentres, function (datacentre) {
                execute(datacentre.url);
            });
        };
        $timeout(warmupServers, 100, false);

        //button handler - hit each server twice, but ignore the first timing
        $scope.run = function () {
            //log the click with Google analytics
            if (typeof ga !== "undefined") {
                ga('send', 'event', 'user action', 'button click', 'GO Button');
            }

            angular.forEach($scope.datacentres, function (datacentre) {
                datacentre.latencyMessage = 'Loading...';
                datacentre.isFailure = false;

                //closes around datacentre
                var gatherData = function (stagger) {
                    //introduce a random delay to reduce interference across requests
                    $timeout(function () {
                        var start = getTime();
                        execute(datacentre.url).error(function () {
                            datacentre.latencyMessage = "Failed";
                            datacentre.isFailure = true;
                        }).success(function () {
                            var elapsed = getTime() - start;
                            var complete = getMostPreciseTime(datacentre.url, elapsed);
                            datacentre.latencyMilliseconds = complete;
                            datacentre.latencyMessage = complete + " ms";
                        });
                    }, stagger ? (Math.random() * 10000) : 0);
                };

                //Hit the page twice, but only grab the second reading. This ensures DNS is resolved etc.
                execute(datacentre.url).then(gatherData, function () {
                    gatherData(true);
                });
            });
        };
    }]);
