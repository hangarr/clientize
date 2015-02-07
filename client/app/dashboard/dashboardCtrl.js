/**
 * AngularJS DashboardCtrl controller function
 */
;(function(){
	'use strict';
	
	var angular = window.angular;

	var pjson = require('../../../package.json');

	function dashboardCtrl($window, $scope, $log, $timeout, $http, $location, OptionsService) {
		$scope.headerMessage = 'Clientize v' + pjson.version;
		
		// manages active state of navbar selections
	    $scope.isActive = function (viewLocation) { 
	        return viewLocation === $location.path();
	    };
	    
	    $scope.logoutHost = $location.host() + ':' + $location.port();
	    
		$scope.optionsShow = false;
		$scope.optionsLoading = true;
		
		OptionsService.getInitialized()
		.then( function(options) {
			$scope.optionsLoading = false;
			$scope.optionsShow = true;
			$scope.options = options;
			$scope.proxyOptions = JSON.stringify($scope.options, null, '    ');
		}, function(err) {
			$scope.optionsLoading = false;
			$scope.optionsShow = true;
			$scope.proxyOptions = err + '\n ' + JSON.stringify(OptionsService.response(), null, '    ');
		});
		
		$scope.logout = function() {

		};
    };
    
    module.exports = dashboardCtrl;
}).call(this);