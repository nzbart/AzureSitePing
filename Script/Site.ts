/// <reference path="../definitelytyped/angularjs/angular.d.ts" />

var ap = angular.module('AzurePing', []);

interface IAzureDatacentre {
    location: string;
    url: string;
    latencyMessage?: string;
    latencyMilliseconds?: number;
    isFailure?: boolean;
}

interface IAzurePingScope extends ng.IScope {
    datacentres: IAzureDatacentre[];
    run(): void;
}

ap.controller('AzurePingCtrl', ['$scope', '$http', '$timeout',
    ($scope: IAzurePingScope, $http: ng.IHttpService, $timeout: ng.ITimeoutService) => {
        $scope.datacentres = [
            { location: 'West USA (California)', url: 'westusa' },
            { location: 'North Central USA (Chicago, IL)', url: 'northcentralusa' },
            { location: 'East USA (Virginia)', url: 'eastusa' },
            { location: 'North Europe (Dublin, Ireland)', url: 'northeurope' },
            { location: 'East Asia (Hong Kong, China)', url: 'eastasia' }
        ];

        var getUrl = datacentreUrl => 'http://' + datacentreUrl + '-azure.azurewebsites.net/Tiny.ashx?callback=JSON_CALLBACK';
        var execute = datacentreUrl => $http.jsonp(getUrl(datacentreUrl), { cache: false, timeout: 10000 })
        var getTime = () => new Date().getTime()

        //warm up server on page load
        var warmupServers = () => angular.forEach($scope.datacentres, (datacentre: IAzureDatacentre) => {
            execute(datacentre.url)
        });
        $timeout(warmupServers, 100, false);

        //button handler - hit each server twice, but ignore the first timing
        $scope.run = () => {
            angular.forEach($scope.datacentres, (datacentre: IAzureDatacentre) => {
                datacentre.latencyMessage = 'Loading...'
                datacentre.isFailure = false;

                //closes around datacentre
                var gatherData = () => {
                    var start = getTime();
                    execute(datacentre.url)
                        .error(() => {
                            datacentre.latencyMessage = "Failed";
                            datacentre.isFailure = true;
                        })
                        .success(() => {
                            var complete = getTime();
                            var elapsed = complete - start;
                            datacentre.latencyMilliseconds = elapsed;
                            datacentre.latencyMessage = elapsed + " ms";
                        });
                }
                
                //Hit the page twice, but only grab the second reading. This ensures DNS is resolved etc.
                execute(datacentre.url).then(gatherData, gatherData);
            });
        };
    }]);