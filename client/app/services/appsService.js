/**
 * AngularJS Service to retrieve Clientize app configurations options
 */
;(function() {
	'use strict';
	
	var angular = window.angular;

	function appsService($http, $location, $q, OptionsService) {
		
		var oio = require('clientize-orchestrate');
		
		var _options, _apps, _db, _response, _err;
		
		// This could be broken out into a separate module determined by the configuration store
		// Because we are both using and demonstrating a client-side application
		// or the reverse proxy we don't want to put this server-side
		function filterApps(response) {
			var apps = [];
			for(var i=0; i<response.body.results.length; i++) {
				apps.push(response.body.results[i].value);
			}
			
			return apps;
		};
	
		// App list initialization function constructor
		// Returns an initialization function that returns a promise object
		function QueryInitializer(options) {
			return $q(function(resolve, reject) {
				var opts = {
				    	protocol: 'http',
				    	host: options.connection.host,
				    	port: options.connection.port,
				    	prefix: '/api.orchestrate.io/' + options.dashboard.app,
//				    	token: options.dashboard.key + ':',
				    	token: { bearer: options.dashboard.key }
				};
				_db = oio(opts);
		    	_db.search(options.db.collection, '*')
		    	.then(function(response) {
		    		_response = response;
	        		_apps = filterApps(_response);
		    		resolve(_apps);
		    	})
		    	.fail(function(err) {
		    		_err = err;
		    		reject('Could not load current proxy applications list');
		    	});	    	
			});
		};
		
		function AppsInitializer() {
			return OptionsService.getInitialized().then(function(options) {
				return QueryInitializer(options);
			}, function(failed) {
				return failed;
			});			
		};

		var _initializedPromise = AppsInitializer();

		var appsObj = {
			getAll: function() {
				_initializedPromise = AppsInitializer();
				return _initializedPromise;				
			},
			getInitialized: function() {
				return _initializedPromise;
			},
			response: function() {
				return _response;
			},
			err: function() {
				return _err;
			}
		};			

		return appsObj;

	};
	
	module.exports = appsService;
}).call(this);