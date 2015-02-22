;(function() {
	'use strict';

	var angular = window.angular;

	// put individual modules here
	var optionsService = require('./optionsService.js')
	  , appsService = require('./appsService.js');
	
	var rpappServices = angular.module('rpapp.services', [])
		.factory('OptionsService', ['$http', '$location', '$q', optionsService])
		.factory('AppsService', ['$http', '$location', '$q', 'OptionsService', appsService]);	
	
	module.exports = rpappServices;
}).call(this);