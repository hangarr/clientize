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
 *				key:						// Dashboard authenticaion key
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
	  , ValidateBasic = require('./validate-basic')
	  , MapUriBasic = require('./mapuri-basic');

	function ReverseProxy(options) {
		if (!(this instanceof ReverseProxy))
			return new ReverseProxy(options);

		this.options = options;
		
		this.server = new Hapi.Server(this.options.server);
	};
	
	ReverseProxy.prototype.configure = function(callback) {
		
		this.server.connection(this.options.connection);

//		this.server.register(HapiAuthBasic, this.proxy.bind(this));
		
		function cb(err) {
			if(err) {
				callback(err);
				return
			};
			
			try {
				if(this.options.dashboard) {
					this.dashboard.bind(this)();
				};
				this.proxy.bind(this)();
				callback(null);
			}
			catch(cerr) {
				callback(cerr);
			};
		}
		
		this.server.register(HapiAuthBasic, cb.bind(this));		
	};
	
	// Private routine to add a route to the server
	function _addProxiedRoute(auth, route) {

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
				auth: auth,
				cors: true
			}
		});
	};
	
	// Adds dashboard endpoints to server
	ReverseProxy.prototype.dashboard = function() {

		// proxy API authentication strategy
		var dopts = ( this.options.dashboard.key ? {username: this.options.dashboard.key} : {} );
		this.server.auth.strategy('dashbasic', 'basic', {
			validateFunc: ValidateBasic(dopts),
			allowEmptyUserName: true
		});

		// serves all static content behind CLIENTIZE_DASH_KEY
		this.server.route({
			method: 'GET',
			path:'/public/{p*}',
			handler: {
		 		directory: {
		            path: Path.join(process.env.PROJECT_DIR, 'public'),
		            listing: false,
		            index: true
		        }
		 	},
		 	config: {
//				auth: 'dashbasic',
		 		cors: true
		 	}
		});
	
		// serves dashboard login page
		this.server.route({
			method: 'GET',
			path:'/', 
			handler: function (request, reply) {
				reply.file(Path.join(process.env.PROJECT_DIR, 'public/index.html'));
			},
			config: {
//				auth: 'dashbasic',
				cors: true
			}
		});
	
		// protected path to the reverse-proxy configuration storage
		for(var i=0; i<this.options.dashboard.routes.length; i++) {
			_addProxiedRoute.call(this, 'dashbasic', this.options.dashboard.routes[i]);
		};
	};
	
	// Adds reverse-proxy endpoints to server
	ReverseProxy.prototype.proxy = function () {

		// proxy API authentication strategy
		var sopts = ( this.options.proxy.key ? {username: this.options.proxy.key} : {} );
		this.server.auth.strategy('apibasic', 'basic', {
			validateFunc: ValidateBasic(sopts),
			allowEmptyUserName: true
		});

		// Provides a ping endpoint to test the credentials
		this.server.route({
			method: 'GET',
			path:'/ping', 
			handler: function (request, reply) {
				reply('Reverse proxy ready');
			},
			config: {
				auth: 'apibasic',
				cors: true
			}
		});
		
		// all the proxied routes
		for(var i = 0; i<this.options.proxy.routes.length; i++) {
			_addProxiedRoute.call(this, 'apibasic', this.options.proxy.routes[i]);
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