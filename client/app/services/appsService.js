/**
 * AngularJS Service to retrieve Clientize app configurations options
 */
;(function() {
	'use strict';
	
	var angular = window.angular;

	function appsService($http, $location, $q, OptionsService) {
		
		var oio = require('clientize-orchestrate')
		  , tv4 = require('tv4');
	
		var _appTemplate = [{
		    app: '// application name specified for CLIENTIZE_DB_APP',
		    key: '// reverse-proxy client API key for CLIENTIZE_PROXY_KEY',
		    routes: [{
		    	method: '// upstream server endpoint HTTP methods (\'GET\' or [\'GET\', \'POST\', ...] or *)',
		    	path: '// client facing endpoint formed as \'/prefix/upstream-path\'',
		    	protocol: '// \'http\' or \'https\'',
		    	host: '// upstream server name',
		    	port: '//upstream server port expressed as a number not a string',
		    	username: '// upstream server Basic mode auth credential, e.g. CLIENTIZE_PROXY_OIOKEY',
		    	password: '// upstream server Basic mode auth credential, typically blank',
		    	bearer: '// upstream server Bearer mode credential, (not yet implemented)',
		    	strip: '// Boolean \'true\' to strip prefix from URL, \'false\' to strip prefix from URL',
		    	prefix: '// prefix for client facing path \'/prefix/upstream-path\''
		    }]
		}];
	
		var _appSchema = {
//			$schema: 'http:\/\/json-schema.org\/draft-04\/schema#',
			title: 'apps schema',
			type: "array",
			items: {
				type: 'object',
				properties: {
					app: { type: 'string' },
					key: { type: 'string' },
					routes: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								method: {
									oneOf: [
									    {
									    	type: 'string',
									    	enum: [ '*', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS' ]
									    },
										{
									    	type: 'array',
									    	items: {
									    		type: 'string',
									    		enum: [ 'GET','POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS' ]							    		
									    	},
									    	additionalItems: false
									    }
									]
								},
								path: {
									pattern: '^((\/[^\/]+)+)$',
									type: 'string'
								},
								protocol: {
									type: 'string',
									enum: [
				            	        'http',
				            	        'https'
				            	    ]
								},
								host: {
									type: 'string',
									format: 'hostname'
								},
								port: {
									type: [ 'number', 'null' ]
								},
								username: {
								    type: [ 'string' , 'null' ]
								},
								password: {
								    type: [ 'string' , 'null' ]
								},
								bearer: {
								    type: [ 'string' , 'null' ]
								},
								strip: {
									type: [ 'boolean', 'null' ]
								},
								prefix: {
									pattern: '^((\/[^\/]+)+)$',
									type: [ 'string', 'null' ]
								}
							},
							additionalProperties: false,
							required: [ 'method', 'path', 'protocol', 'host' ],

							oneOf: [
							    {
								    anyOf: [
									    { type: 'object', required: [ 'username' ] },
									    { type: 'object', required: [ 'password' ] }
									]
							    },
							    {
								    type: 'object',
								    required: [ 'bearer' ]
							    }
							]

						},
						additionalItems: false,
					}
				},
				additionalProperties: false,
				required: [ "app", "routes" ],
			},
			additionalItems: false
		};
		
		var _apps, _db, _response, _err;
		
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
				if(!options.db || !options.dashboard.app || !options.dashboard.key) {
					_response = null;
					_apps = null;
					reject('App storage not configured');
					return;
				}
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
		
		// Apps list initializer
		// Returns a promise object
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
			},
			appTemplate: function () {
				return _appTemplate;
			},
			appSchema: function() {
				return _appSchema;
			},
			appsValidate: function() {
				var _tv4validator = tv4.freshApi();
				var _schema = _appSchema;
				return function(json) {
					var _json = json.replace(/\s+/g, ' ');
					try {
						var js = JSON.parse(_json);
					}
					catch (e) {
						return {
							js: js,
							json: json,
							validation: {
								valid: false,
								errors: e
							}
						};
					};
					var validation = _tv4validator.validateMultiple(js, _schema);
					for(var i=0; i<validation.errors.length; i++) {
						delete validation.errors[i].stack;
					};
					return {
						js: js,
						json: _json,
						validation: validation
					};
				};
			}
		};			

		return appsObj;

	};
	
	module.exports = appsService;
}).call(this);