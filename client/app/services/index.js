;(function() {
	'use strict';

	var angular = window.angular;

	// put individual modules here
	var optionsService = require('./optionsService.js')
	  , appsService = require('./appsService.js');
	
	var rpappServices = angular.module('rpapp.services', [])
		.factory('OptionsService', optionsService)
		.factory('AppsService', appsService);	
	
	module.exports = rpappServices;
}).call(this);