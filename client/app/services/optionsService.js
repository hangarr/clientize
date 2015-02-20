/**
 * AngularJS Service to retrieve Clientize proxy options
 */
;(function() {
	'use strict';
	
	var angular = window.angular;
	
	function optionsService($http, $location, $q) {

		var Promise = require('clientize-rak').angular($q);
		
		var HOST = $location.host() + (typeof $location.port() === 'undefined' ? '' : ':' + $location.port());
		var API = 'http://' + HOST + '/options';
	
		var httpConfig = {
			headers: { 'Content-Type': 'application/json; charset=UTF-8'},
//			transformRequest: _transform,
			responseType: 'json',
			params: null
		};

		// Proxy configuration initialization promise constructor 
		// Returns an initialization function that returns a promise object
		function loadOptions(url, config) {
			// Proxy configuration initialization promise constructor 
			// Returns an initialization function that returns a promise object
			return $http.get(url, config)
			.then(function(result) {
				if(result.data)
					return result.data;
				else
					Promise.reject('No current proxy configuration data');
			}, function(fail) {
				return 'Could not load current proxy configuration';
			});
		};

		var _initializedPromise;
		var optionsObj = {
			get: function() {
				_initializedPromise = loadOptions(API, httpConfig);
				return _initializedPromise;
			},
			getInitialized: function() {
				return _initializedPromise;
			},
		};

		optionsObj.get();

		return optionsObj;
	};
		
	module.exports = optionsService;
}).call(this);