/// <reference path="../definitelytyped/angularjs/angular.d.ts" />

var ap = angular.module('AzurePing', []);

interface IAzureDatacentre {
    location: string;
    url: string;
    latencyMessage?: string;
    latencyMilliseconds?: number;
    failureReason?: string;
}

interface IAzurePingScope extends ng.IScope {
    datacentres: IAzureDatacentre[];
    run(): void;
}

ap.controller('AzurePingCtrl', ['$scope', '$http',
    ($scope: IAzurePingScope, $http: ng.IHttpService) => {
        $scope.datacentres = [
            { location: 'West USA (California)', url: 'westusa' },
            { location: 'North Central USA (Chicago, IL)', url: 'northcentralusa' },
            { location: 'East USA (Virginia)', url: 'eastusa' },
            { location: 'North Europe (Dublin, Ireland)', url: 'northeurope' },
            { location: 'East Asia (Hong Kong, China)', url: 'eastasia' }
        ];

        $scope.run = () => {
            angular.forEach($scope.datacentres, (datacentre: IAzureDatacentre) => {
                datacentre.latencyMessage = 'Loading...'
                var url = 'http://' + datacentre.url + '-azure.azurewebsites.net/Tiny.ashx?callback=JSON_CALLBACK';
                //Hit the page twice, but only grab the second reading. This ensures DNS is resolved etc.
                $http.jsonp(url, { cache: false, timeout: 10000 })
                    .error((reason) => {
                        datacentre.failureReason = reason;
                    })
                    .success(() => {
                        var start = new Date().getTime();
                        $http.jsonp(url, { cache: false, timeout: 10000 })
                            .error((reason) => {
                                datacentre.failureReason = reason;
                            })
                            .success(() => {
                                var complete = new Date().getTime()
                                var elapsed = complete - start;
                                datacentre.latencyMilliseconds = elapsed;
                                datacentre.latencyMessage = elapsed + " ms";
                            });
                    });
            });
        };
    }]);