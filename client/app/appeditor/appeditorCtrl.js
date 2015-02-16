/**
 * AppEditorCtrl controller function
 */
;(function(){
	'use strict';
	
	var angular = window.angular;
	var generatekey = require('../../common/generatekey.js');

	function appeditorCtrl($window, $scope, $log, $modal, $timeout, $location, AppsService) {
		
		$scope.JSON = JSON;
		
		$scope.appsShow = false;
		$scope.appsEdit = false;
		$scope.appsLoading = true;

		$scope.appTemplate = AppsService.appTemplate();
		$scope.appSchema = AppsService.appSchema(), null;
		$scope.appsValidator = AppsService.appsValidate();
	
		// support for Template modal
		$scope.openInfo = function() {
			var modalInstance = $modal.open({
				templateUrl: 'templateModal.html',
				size: 'lg',
				scope: $scope
			});
		};
		
		// support for Template modal
		$scope.newApiKey = function() {
			$scope.apiKey = generatekey([8,8,8,8], '-');
		};
		$scope.openKey = function() {
			$scope.newApiKey();
			var modalInstance = $modal.open({
				templateUrl: 'keyModal.html',
				size: 'lg',
				scope: $scope
			});
		};
		
		AppsService.getInitialized()
		.then( function(apps) {
			$scope.appsLoading = false;
			$scope.appsShow = true;
			$scope.apps = JSON.stringify(apps, null, '    ');
		}, function(failed) {
			$scope.appsLoading = false;
			$scope.appsShow = true;
			$scope.appsErr = failed + (AppsService.err() ? ':\n ' + AppsService.err() : '');
			$scope.apps = null;
		});
		
		// fill the edit buffer and open the editor
		$scope.edit = function() {
			if($scope.apps === null)
				return;

			$scope.appsFormBuffer = JSON.stringify(JSON.parse($scope.apps), null, '    ');
			$scope.appsShow = false;
			$scope.appsEdit = true;			
		};
		
		// close the editor and discard the edit buffer
		$scope.cancel = function() {
			$scope.appsFormBuffer = null;
			$scope.appsEdit = false;
			$scope.appsShow = true;
		};
		
		// validate the contents of the edit buffer
		$scope.validate = function() {
			$scope.validationResults = $scope.appsValidator($scope.appsFormBuffer);

			return $scope.validationResults.validation.valid;
		};
		
		$scope.saveApp = function() {
			if(!$scope.validate())
				return;

			AppsService.saveAll($scope.validationResults.js);
/*
			$scope.appsFormBuffer = null;
			$scope.appsEdit = false;
			$scope.appsShow = true;
*/	
		};
   };
    
    module.exports = appeditorCtrl;
}).call(this);