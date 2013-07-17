var ap = angular.module('AzurePing', []);

ap.controller('AzurePingCtrl', [
    '$scope',
    '$http',
    function ($scope, $http) {
        $scope.datacentres = [
            { location: 'West USA (California)', url: 'westusa' },
            { location: 'North Central USA (Chicago, IL)', url: 'northcentralusa' },
            { location: 'East USA (Virginia)', url: 'eastusa' },
            { location: 'North Europe (Dublin, Ireland)', url: 'northeurope' },
            { location: 'East Asia (Hong Kong, China)', url: 'eastasia' }
        ];

        $scope.run = function () {
            angular.forEach($scope.datacentres, function (datacentre) {
                datacentre.latencyMessage = 'Loading...';
                var url = 'http://' + datacentre.url + '-azure.azurewebsites.net/Tiny.ashx?callback=JSON_CALLBACK';

                $http.jsonp(url, { cache: false, timeout: 10000 }).error(function (reason) {
                    datacentre.failureReason = reason;
                }).success(function () {
                    var start = new Date().getTime();
                    $http.jsonp(url, { cache: false, timeout: 10000 }).error(function (reason) {
                        datacentre.failureReason = reason;
                    }).success(function () {
                        var complete = new Date().getTime();
                        var elapsed = complete - start;
                        datacentre.latencyMilliseconds = elapsed;
                        datacentre.latencyMessage = elapsed + " ms";
                    });
                });
            });
        };
    }
]);
