/**
 * AppEditorCtrl controller function
 */
;(function(){
	'use strict';
	
	var angular = window.angular;
	
	function appeditorCtrl($window, $scope, $log, $timeout, $location, AppsService) {
		
		$scope.appsShow = false;
		$scope.appsLoading = true;
	
		AppsService.getInitialized()
		.then( function(apps) {
console.log('point 1');
			$scope.appsLoading = false;
			$scope.appsShow = true;
			$scope.apps = JSON.stringify(apps, null, '    ');
		}, function(failed) {
console.log('point 2');
			$scope.appsLoading = false;
			$scope.appsShow = true;
			$scope.apps = failed + ':\n ' + AppsService.err();
		});
    };
    
    module.exports = appeditorCtrl;
}).call(this);