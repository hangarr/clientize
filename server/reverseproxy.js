/**
 *  API Reverse Proxy Server object
 *
 * @constructor
 * @param {Object}
 *
 * The configuration object has the form:
 *
 *  	options = {
 *  		connection: {
 *				host:						// API server
 *				port:						// optional
 *			},
 *			dashboard: {
 *				key:						// Dashboard authentication key
 *			},
 *			db: {
 *				collection:					// API configuration DB collection
 *				app:						// Name of configuration app in DB
 *				key:						// DB authentication key				
 *			},
 *			proxy: {
 *				key:     					// optional API "key"
 *  			routes: [{
 *      			method:
 *					path:					// upstream host path
 *					protocol: 
 *					host:
 *					port:					// optional
 *					username:				// frequently aka "key"
 *					password:				// optional
 *					strip:					// optionally strip host-port prefix to get upstream URI
 *					prefix:					// optional prefix to be stripped
 *				}]
 *			}
 *  	}
 *
 *
 */
;(function() {
	'use strict';
	var Hapi = require('hapi')
	  , Path = require('path')
	  , HapiAuthBasic = require('hapi-auth-basic')
//	  , HapiAuthBearerToken = require('hapi-auth-bearer-token')
	  , HapiAuthBearerToken = require('./auth-bearer.js')
	  , async = require('async')
	  , ValidateBasic = require('./validate-basic')
	  , MapUriBasic = require('./mapuri-basic');
	
	var corsConfig = {
		additionalHeaders: ['X-Clientize-Authenticate']
	};

	function ReverseProxy(options) {
		if (!(this instanceof ReverseProxy))
			return new ReverseProxy(options);

		this.options = options;
		
		this.server = new Hapi.Server(this.options.server);
	};

	
	ReverseProxy.prototype.configure = function(callback) {
		var that = this;
		
		this.server.connection(this.options.connection);
		
		var that = this;

		var authSchemes = [
		    function(callback) {
		    	that.server.register(HapiAuthBasic, function(err) {
		    		callback(err);
		    	});
		    },
			function(callback) {
				that.server.register(HapiAuthBearerToken, function(err) {
					callback(err);
				});
			}
		];
		
		var routesLogin = [
			function(callback) {
				that.server.auth.strategy('dashlogin', 'basic', that.authBasicOptions(that.options.dashboard.login));
				callback(null);
			},
			function(callback) { 
				that.dashboard('dashlogin');
				callback(null); 
			}
		];
		
		var routesProxy = [
			function(callback) {
//				that.server.auth.strategy('apibearer', 'basic', that.authBasicOptions(that.options.proxy.key));
				that.server.auth.strategy('apibearer', 'bearer-access-token', that.authBearerOptions(that.options.proxy.key));
				callback(null);
			},
			function(callback) {
				that.proxy('apibearer');
				callback(null);
			}
		];
	
		var routesDashboard = [
			function(callback) {
//				that.server.auth.strategy('dashbearer', 'basic', that.authBasicOptions(that.options.dashboard.key));
				that.server.auth.strategy('dashbearer', 'bearer-access-token', that.authBearerOptions(that.options.dashboard.key));
				callback(null);
			},
			function(callback) {
				that.apps('dashbearer');
				callback(null);
			}
		];

		var routeConfigs = authSchemes.concat(routesProxy);
		if(typeof that.options.dashboard !== 'undefined'  && typeof that.options.dashboard.key !== 'undefined')
			routeConfigs = routeConfigs.concat(routesDashboard);
		if(typeof that.options.dashboard.login !== 'undefined')
			routeConfigs = routeConfigs.concat(routesLogin);

/*
		var routeConfigs = [

			function(callback) {
				that.server.register(HapiAuthBasic, function(err) {
					callback(err);
				});
			},

			function(callback) {
				that.server.auth.strategy('dashbasic', 'basic', that.authBasicOptions(that.options.dashboard.key));
				callback(null);
			},

			function(callback) { 
				that.dashboard('dashbasic');
				callback(null); 
			},

			function(callback) {
				that.apps('dashbasic');
				callback(null);
			},
			
			function(callback) {
				that.server.auth.strategy('apibasic', 'basic', that.authBasicOptions(that.options.proxy.key));
				callback(null);
			},

			function(callback) {
				that.proxy('apibasic');
				callback(null);
			}
		];
*/
		async.series(routeConfigs, function(err, results) {
			callback(err);
		});

	};
	
	// Private routine to add a route to the server
	function _addProxiedRoute(strategy, route) {

		var mopts = {
			protocol: route.protocol,
			host: route.host,
		};
		if(typeof route.username !== 'undefined')
			mopts.username = route.username;
		if(typeof route.password !== 'undefined')
			mopts.password = route.password;
		if(typeof route.strip !== 'undefined')
			mopts.strip = route.strip;
		if(typeof route.prefix !== 'undefined')
			mopts.prefix = route.prefix;

		this.server.route({
			method: route.method,
			path: route.path, 
			handler: {
				proxy: {
					mapUri: MapUriBasic(mopts),
					passThrough: true,
					xforward: false
				}
			},
			config: {
				auth: strategy,
				cors: corsConfig
			}
		});
	};

	// Defines dashboard client-facing login strategy to server
	ReverseProxy.prototype.authBasicOptions = function(optusername, optpassword) {
		var nousername = (typeof optusername === 'undefined');
		var _optusername = (nousername ? '' : optusername);
		var nopassword = (typeof optpassword === 'undefined');
		var _optpassword = (nopassword ? '' : optpassword);
		return {
			allowEmptyUserName: true,
			validateFunc: function(username, password, callback) {
				var isValidUsername = nousername || (typeof username !== 'undefined' && optusername === username);
				var isValidPassword = nopassword || (typeof password !== 'undefined' && optpassword === password);
				var isValid = isValidUsername && isValidPassword;
				callback( null, isValid, { username: 'clientize' } );
			}
		};	
	};

	// Defines dashboard client-facing authentication strategy to server
	ReverseProxy.prototype.authBearerOptions = function(opttoken) {
		var _opttoken = opttoken;
		return {
			allowQueryToken: true,
			allowMultipleHeaders: false,
			accessTokenName: 'access_token',
			validateFunc: function(token, callback) {
console.log('token: ' + token);
				var isValid = (typeof token !== 'undefined' && _opttoken === token);
				callback( null, isValid, { token: token } );
			}
		};
	};

	// Adds dashboard endpoints to server
	ReverseProxy.prototype.dashboard = function(strategy) {
		// serves all static content behind CLIENTIZE_DASH_KEY
		this.server.route({
			method: 'GET',
			path: '/public/{p*}',
			handler: {
		 		directory: {
		            path: Path.join(process.env.PROJECT_DIR, 'public'),
		            listing: false,
		            index: true
		        }
		 	},
		 	config: {
				auth: strategy,
		 		cors: corsConfig
		 	}
		});
		
		// serves configuration object
		function optionsCb(request, reply) {
			reply(this.options);
		};
		this.server.route({
			method: 'GET',
			path: '/options',
/*
			handler: function (request, reply) {
				reply(this.options);
			},
*/
			handler: optionsCb.bind(this),
			config: {
				auth: strategy,
				cors: corsConfig
			}
		});

		// serves dashboard page login
		this.server.route({
			method: 'GET',
			path: '/', 
			handler: function (request, reply) {
				reply.file(Path.join(process.env.PROJECT_DIR, 'public/index.html'));
			},
			config: {
				auth: strategy,
				cors: corsConfig
			}
		});
	
		// serves dashboard apps page
		this.server.route({
			method: 'GET',
//			path: '/{p*}',
			path: '/apps',
			handler: function (request, reply) {
				reply.file(Path.join(process.env.PROJECT_DIR, 'public/index.html'));
			},
			config: {
				auth: strategy,
				cors: corsConfig
			}
		});
	
	};
	
	// Adds app configuration reverse proxy endpoints
	ReverseProxy.prototype.apps = function(strategy) {

		// protected path to the reverse-proxy configuration storage
		for(var i=0; i<this.options.dashboard.routes.length; i++) {
			_addProxiedRoute.call(this, strategy, this.options.dashboard.routes[i]);
		};		
	};
	
	// Adds reverse-proxy endpoints to server
	ReverseProxy.prototype.proxy = function (strategy) {
		// Provides a ping endpoint to test the credentials
		this.server.route({
			method: 'GET',
			path:'/ping', 
			handler: function (request, reply) {
				reply('Reverse proxy ready');
			},
			config: {
				auth: strategy,
				cors: corsConfig
			}
		});
		
		// all the proxied routes
		for(var i = 0; i<this.options.proxy.routes.length; i++) {
			_addProxiedRoute.call(this, strategy, this.options.proxy.routes[i]);
		};	
	};
	
	ReverseProxy.prototype.start = function(callback) {
/*		
		function cleanup() {
			var _this = this;
			return function(err) {
				callback(err);
			};
		};
*/
		function cleanup(err) {
			callback(err);
		};

		this.server.start(cleanup.bind(this));	
	};
	
	ReverseProxy.prototype.stop = function(callback) {
/*		
		function cleanup() {
			var _this = this;
			return function(err) {
				delete _this.server;
				callback(err);
			};
		};
*/
		function cleanup(err) {
			delete this.server;
			callback(err);
		};
		
		this.server.stop(cleanup.bind(this));
	};
	
	ReverseProxy.prototype.table = function() {
		return this.server.connections[0].table();
	};
	
	ReverseProxy.prototype.routes = function() {
		var table = this.table();
		var routes = [];
		for(var i=0; i<table.length; i++) {
			routes.push(table[i].path);
		};
		
		return routes;
	};
	
	/*==========================================================================*/
	/* Export info																*/
	/*==========================================================================*/

	// AMD / RequireJS
	if (typeof define !== 'undefined' && define.amd) {
		define([], function() {
			return ReverseProxy;
		});
	}
	// Node.js
	else if (typeof module !== 'undefined' && module.exports) {
		module.exports = ReverseProxy;
	}
	// included directly via <script> tag
	else {
		this.ReverseProxy = ReverseProxy;
	}

}).call(this);