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
    supportsPerformanceApi: boolean;
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

        var getUrl = (datacentreUrl: string, excludeJson?: boolean) => 'http://' + datacentreUrl + '-azure.azurewebsites.net/Tiny.ashx' + (excludeJson ? '': '?callback=JSON_CALLBACK');
        var execute = (datacentreUrl: string) => $http.jsonp(getUrl(datacentreUrl), { cache: false, timeout: 10000 })
        var getTime = () => new Date().getTime()
        var doesSupportPerformanceApi = () => !!(window.performance && window.performance.getEntries);
        var getMostPreciseTime = (url: string, lowResolutionTime: number) => {
            if (!doesSupportPerformanceApi()) {
                return lowResolutionTime;
            }
            
            var fullUrlPrefix = getUrl(url, true);
            var thisUrlReadings = window.performance.getEntries().filter(val => val.name.indexOf(fullUrlPrefix) === 0);
            if (thisUrlReadings === 0) {
                return lowResolutionTime;
            }
            var thisUrlMostRecentReading = thisUrlReadings[thisUrlReadings.length - 1];
            if (!thisUrlMostRecentReading.duration) {
                return lowResolutionTime;
            }

            return Math.round(thisUrlMostRecentReading.duration);
        }

        $scope.supportsPerformanceApi = doesSupportPerformanceApi();

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
                            var elapsed = getTime() - start;
                            var complete = getMostPreciseTime(datacentre.url, elapsed);
                            datacentre.latencyMilliseconds = complete;
                            datacentre.latencyMessage = complete + " ms";
                        });
                }
                
                //Hit the page twice, but only grab the second reading. This ensures DNS is resolved etc.
                execute(datacentre.url).then(gatherData, gatherData);
            });
        };
    }]);