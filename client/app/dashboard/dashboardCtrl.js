/**
 * 
 */
;(function(){
	'use strict';
	
//	var ng = require('angular')
	var angular = window.angular;

	var pjson = require('../../../package.json');

	function dashboardCtrl($window, $scope, $log, $timeout, $location) {
		$scope.helloMessage = 'Reverse Proxy Dashboard: ' + pjson.name;
    };
    
    module.exports = dashboardCtrl;
}).call(this);