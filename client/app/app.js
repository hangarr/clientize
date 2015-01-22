/**
 * Root script for the AngularJS application
 */
;(function() {

	var ng = require('angular')
	  , ngRoute = require('angular-route')
	  , angular = window.angular;

//	var angular = window.angular;

	var services = require('./services')	
	  , directives = require('./directives')
	  , filters = require('./filters')
	  , dashboard = require('./dashboard')
	  , pjson = require('../../package.json');

	var rpapp = angular.module('rpapp', [
	        'ngRoute',
	        services.name,
	        directives.name,
	        filters.name,
	        dashboard.name
	    ])
//		.config()
		.constant('version', pjson.version);

}).call(this);
