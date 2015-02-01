/**
 * Root script for the AngularJS application
 */
;(function() {

	var ngLd = require('angular')
	  , ngResourceLd = require('angular-resource')
	  , ngTouchLd = require('angular-touch')
	  , ngRouteLd = require('angular-route')
	  , ngBootstrapLd = require('angular-bootstrap');
	  
	var angular = window.angular;

	var services = require('./services')	
	  , directives = require('./directives')
	  , filters = require('./filters')
	  , dashboard = require('./dashboard')
	  , appeditor = require('./appeditor')
	  , routeconfig = require('./config/routeConfig')
	  , pjson = require('../../package.json');

	var rpapp = angular.module('rpapp', [
	        'ngRoute',
	        'ui.bootstrap',
	        services.name,
	        directives.name,
	        filters.name,
	        dashboard.name,
	        appeditor.name
	    ])
		.config(routeconfig)
		.constant('version', pjson.version);

	module.exports = rpapp;
}).call(this);
