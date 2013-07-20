var ap = angular.module('AzurePing', []);

ap.controller('AzurePingCtrl', [
    '$scope',
    '$http',
    '$timeout',
    function ($scope, $http, $timeout) {
        $scope.datacentres = [
            { location: 'West USA (California)', url: 'westusa' },
            { location: 'North Central USA (Chicago, IL)', url: 'northcentralusa' },
            { location: 'East USA (Virginia)', url: 'eastusa' },
            { location: 'North Europe (Dublin, Ireland)', url: 'northeurope' },
            { location: 'East Asia (Hong Kong, China)', url: 'eastasia' }
        ];

        var getUrl = function (datacentreUrl) {
            return 'http://' + datacentreUrl + '-azure.azurewebsites.net/Tiny.ashx?callback=JSON_CALLBACK';
        };
        var execute = function (datacentreUrl) {
            return $http.jsonp(getUrl(datacentreUrl), { cache: false, timeout: 10000 });
        };
        var getTime = function () {
            return new Date().getTime();
        };

        var warmupServers = function () {
            return angular.forEach($scope.datacentres, function (datacentre) {
                execute(datacentre.url);
            });
        };
        $timeout(warmupServers, 100, false);

        $scope.run = function () {
            angular.forEach($scope.datacentres, function (datacentre) {
                datacentre.latencyMessage = 'Loading...';
                datacentre.isFailure = false;

                var gatherData = function () {
                    var start = getTime();
                    execute(datacentre.url).error(function () {
                        datacentre.latencyMessage = "Failed";
                        datacentre.isFailure = true;
                    }).success(function () {
                        var complete = getTime();
                        var elapsed = complete - start;
                        datacentre.latencyMilliseconds = elapsed;
                        datacentre.latencyMessage = elapsed + " ms";
                    });
                };

                execute(datacentre.url).then(gatherData, gatherData);
            });
        };
    }
]);
