/**
 * AngularJS Service to retrieve Clientize app configurations options
 */
;(function() {
	'use strict';
	
	var angular = window.angular;

	function appsService($http, $location, $q, OptionsService) {

//		var Promise = require('clientize-rak').angular($q);
		
//		var oio = require('clientize-orchestrate')
		var Promise = require('clientize-rak').angular($q)
		  , oio = require('clientize-orchestrate')(Promise)
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
	
		var _appsSchema = {
//			$schema: 'http:\/\/json-schema.org\/draft-04\/schema#',
			title: 'apps schema',
			type: 'object',
			properties: {
				apps: {
					type: 'array',
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
						required: [ 'app', 'routes' ],
					},
					additionalItems: false,
				}
			},
			additionalProperties: false,
			required: ['apps']
		};
		
		// Initialize storage accessor for configuration document
		function dbOpts(options) {
			if(!options.db || !options.dashboard.app || !options.dashboard.key) {
				_response = null;
				_apps = null;
			}
			else return {
//			    protocol: 'http',
//		    	protocol: options.connection.protocol,
//		    	host: options.connection.host,
//		    	port: options.connection.port,
		    	protocol: options.web.protocol,
		    	host: options.web.host,
		    	port: options.web.port,
			    prefix: '/api.orchestrate.io/' + options.dashboard.app,
//			    token: options.dashboard.key + ':',
			    token: { bearer: options.dashboard.key }
			};
		};


		var _apps, _response;
		
		// Apps list initializer
		// Returns a promise object
		function loadDoc() {
			return OptionsService.getInitialized().then(function(options) {
				return new Promise(function(resolve, reject) {
					var opts = dbOpts(options);
					if(!opts) {
						reject('App storage not configured');
						return;
					};
					
					oio(opts).get(options.db.collection, options.db.config)
					.then(function(response) {
						_response = response;
						_apps = _response.body;
						resolve(_apps);
/*
					})
					.fail(function(err) {
			    		reject({
			    			message: 'Could not load proxy applications list',
			    			err: err
			    		});
					});
*/   	
					}, function(err) {
			    		reject({
			    			message: 'Could not load proxy applications list',
			    			err: err
			    		});
					});
				});
			}, function(fail) {
				return fail;
			});			
		};

		
		// Configuration document validator
		// Returns validation result object
		function validateDoc(json) {
			var _json = json.replace(/\s+/g, ' ');
			try {
				var js = JSON.parse(_json);
			}
			catch (e) {
				return {
					js: js,
					json: _json,
					validation: {
						valid: false,
						errors: e
					}
				};
			};
			var validation = tv4.freshApi().validateMultiple(js, _appsSchema);
			for(var i=0; i<validation.errors.length; i++) {
				delete validation.errors[i].stack;
			};
			return {
				js: js,
				json: _json,
				validation: validation
			};
		};			

		
		// Save the app configuration document
		// Returns a promise
		function storeDoc(apps) {
			return OptionsService.getInitialized().then(function(options) {
				return new Promise(function(resolve, reject) {
					var opts = dbOpts(options);
					if(!opts) {
						reject('Apps storage not configured');
						return;
					};
					
					var db = oio(opts);
					if(_apps)
						var dbMethod = db.merge;
					else
						var dbMethod = db.put;
					dbMethod.call(db, options.db.collection, options.db.config, apps)
					.then(function(response) {
						resolve({
							message: 'Stored proxy applications list',
							response: response
						});
					}, function(err) {
						reject({
							message: 'Could not store proxy applications list',
							err: err
						});
					});
/*
					})
					.fail(function(err) {
						reject({
							message: 'Could not store proxy applications list',
							err: err
						});
					});
*/   	
				});
			}, function(fail) {
				return fail;
			});			
		};
	
		var _initializedPromise;

		var appsObj = {
			get: function() {
				_initializedPromise = loadDoc();
				return _initializedPromise;			
			},
			getInitialized: function() {
				return _initializedPromise;
			},
			response: function() {
				return _response;
			},
			appTemplate: function () {
				return _appTemplate;
			},
			appsSchema: function() {
				return _appsSchema;
			},
			appsValidate: function(json) {
				return validateDoc(json);
			},
			put: function(newApps) {
				return storeDoc(newApps);
			}
		};			

//		appsObj.get();

		return appsObj;

	};
	
	module.exports = appsService;
}).call(this);