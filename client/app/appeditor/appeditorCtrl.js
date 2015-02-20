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
		$scope.appsLoading = false;

		$scope.appTemplate = AppsService.appTemplate();
		$scope.appsSchema = AppsService.appsSchema(), null;
	
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
		
		$scope.load = function() {
			$scope.appsShow = false;
			$scope.appsEdit = false;
			$scope.appsLoading = true;
			return AppsService.get()
			.then( function(apps) {
				$scope.appsLoading = false;
				$scope.apps = apps;
				$scope.appsStatus = '';
				$scope.appsShow = true;
			}, function(fail) {
				$scope.appsLoading = false;
				$scope.apps = '';
				$scope.appsStatus = fail;
				$scope.appsShow = true;
			});
		};
		$scope.load();
		
		// fill the edit buffer and open the editor
		$scope.edit = function() {
			$scope.appsFormBuffer = JSON.stringify($scope.apps, null, '    ');
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
			$scope.validationResults = AppsService.appsValidate($scope.appsFormBuffer);
			$scope.appsEditStatus = $scope.validationResults.validation;

			return $scope.validationResults.validation.valid;
		};
		
		$scope.saveDoc = function() {
			if(!$scope.validate())
				return;

			$scope.appsShow = false;
			$scope.appsEdit = false;
			$scope.appsLoading = true;
			AppsService.put($scope.validationResults.js)
			.then(function(result) {
				$scope.appsFormBuffer = null;
				return $scope.load();
			}, function(fail) {
				$scope.appsLoading = false;
				$scope.appsEditStatus = fail;
				$scope.appsEdit = true;			
			});		
		};
   };
    
    module.exports = appeditorCtrl;
}).call(this);