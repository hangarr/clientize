/**
 * AngularJS  angular.module wrapper for the ngRoute configuration function
 */
;(function() {
	'use strict';
	
	var angular = window.angular;

	var routeConfig = require('./routeConfig.js');
	
	var rpappRouteConfig = angular.module('rpapp.routeConfig', [])
		.config(['$routeProvider', '$locationProvider', routeConfig]);

	module.exports = rpappRouteConfig;
}).call(this);
