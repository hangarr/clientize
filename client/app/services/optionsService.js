/**
 * AngularJS Service to retrieve Clientize proxy options
 */
;(function() {
	'use strict';
	
	var angular = window.angular;

	function optionsService($http, $location, $q) {
		
		var HOST = $location.host() + (typeof $location.port() === 'undefined' ? '' : ':' + $location.port());
		var API = 'http://' + HOST + '/options';
	
		var httpConfig = {
			headers: { 'Content-Type': 'application/json; charset=UTF-8'},
//			transformRequest: _transform,
			responseType: 'json',
			params: null
		};
		
		var _response;
		
		// Proxy configuration initialization promise constructor 
		// Returns an initialization function that returns a promise object
		function OptionsInitializer(url, config) {
			return $q(function(resolve, reject) {
				$http.get(url, config)
				.then(function(response) {
					_response = response;
					if(_response.data)
						resolve(_response.data);
					else
						$q.reject('No current proxy configuration data');
				}, function(response) {
					_response = response;
					reject('Could not load current proxy configuration');
				});
/*
				.success(function(data, status, headers, config) {
					// data contains the response
					// status is the HTTP status
					// headers is the header getter function
					// config is the object that was used to create the HTTP request
					options = {
						data: data,
						status: status,
						headers: headers,
						config: config
					};
					resolve('Loaded current proxy configuration');
				})
				.error(function(data, status, headers, config) {
					options = {
						data: data,
						status: status,
						headers: headers,
						config: config
					};
					reject('Could not load current proxy configuration');
				});
*/
			});
		};

		var _initializedPromise = OptionsInitializer(API, httpConfig);

		var optionsObj = {
			get: function() {
				_initializedPromise = OptionsInitializer(API, httpConfig);
				return _initializedPromise;
			},
			getInitialized: function() {
				return _initializedPromise;
			},
			response: function() {
				return _response;
			}
		};			

		return optionsObj;
	};
	
	module.exports = optionsService;
}).call(this);