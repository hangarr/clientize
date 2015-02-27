/**
 * Reverse proxy demo
 */
/**
 * CLIENTIZE_HOST				= Reverse-proxy host (optional)
 * CLIENTIZE_PORT				= Reverse-proxy host port (optional)
 * CLIENTIZE_PROTOCOL			= Host http/https protocol (optional)
 * CLIENTIZE_WEB_HOST			= Webserver in front of reverse-proxy host (optional)
 * CLIENTIZE_WEB_PORT			= Webserver in front of reverse-proxy host port (optional)
 * CLIENTIZE_WEB_PROTOCOL		= Webserver in front of reverse-proxy host http/https protocol (optional)
 * CLIENTIZE_DB_OIOCOLLECTION	= Orchestrate.io collection for configuration storage
 * CLIENTIZE_DB_CONFIG			= Name of reverse-proxy configuration doc in CLIENTIZE_DB_OIOCOLLECTION
 * CLIENTIZE_DB_APP				= Name of reverse-proxy configuration app in CLIENTIZE_DB_CONFIG doc
 * CLIENTIZE_DB_OIOKEY			= Orchestrate.io API key for reverse-proxy configuration storage
 * CLIENTIZE_PROXY_OIOKEY		= Orchestrate.io API key for reverse-proxy
 * CLIENTIZE_PROXY_KEY			= Client application key for reverse-proxy
 * CLIENTIZE_PROXY_HOST			= Default upstream host
 * CLIENTIZE_PROXY_PORT			= Default upstream host port
 * CLIENTIZE_PROXY_PROTOCOL		= Default upstream host protocol
 * CLIENTIZE_DASHBOARD_LOGIN	= Client dashboard application login password
 * CLIENTIZE_DASHBOARD_KEY		= Client application key for Orchestrate.io configuration storage
 * CLIENTIZE_DASHBOARD_OIOKEY	= Orchestrate.io API key for configuration storage  
 */
;(function() {
	'use strict';
	process.env.PROJECT_DIR = __dirname;

	var Hoek = require('hoek')
	  ,	ReverseProxy = require('./server/reverseproxy')
	  , generatekey = require('./server/generatekey')
	  ,	Path = require('path')
	  , assert = require('assert')
	  , async = require('async')
	  , Promise = require('bluebird')
//	  , oio = require('clientize-orchestrate');
	  , oio = require('clientize-orchestrate')(Promise);

	var clientizeOptions = {};

	if(process.env.CLIENTIZE_HOST)
		clientizeOptions.HOST = process.env.CLIENTIZE_HOST;
	else if(process.env.HOST)
		clientizeOptions.HOST = process.env.HOST;
	else
		clientizeOptions.HOST = 'localhost';
	
	if(process.env.CLIENTIZE_PORT)
		clientizeOptions.PORT = process.env.CLIENTIZE_PORT;
	else if(process.env.PORT)
		clientizeOptions.PORT = process.env.PORT;
	
	if (process.env.CLIENTIZE_PROTOCOL)
		clientizeOptions.PROTOCOL = (process.env.CLIENTIZE_PROTOCOL === 'https' ? 'https' : 'http');		
	else if(process.env.PROTOCOL)
		clientizeOptions.PROTOCOL = process.env.PROTOCOL;
	else
		clientizeOptions.PROTOCOL = 'http';

	if(process.env.CLIENTIZE_WEB_HOST) {
		clientizeOptions.WEB_HOST = process.env.CLIENTIZE_WEB_HOST;
		if(process.env.CLIENTIZE_WEB_PORT)
			clientizeOptions.WEB_PORT = process.env.CLIENTIZE_WEB_PORT;
		if(process.env.CLIENTIZE_WEB_PROTOCOL)
			clientizeOptions.WEB_PROTOCOL = (process.env.CLIENTIZE_WEB_PROTOCOL === 'http' ? 'http' : 'https');
		else
			clientizeOptions.WEB_PROTOCOL = 'https';
	}
	else {
		clientizeOptions.WEB_HOST = clientizeOptions.HOST;
		if(clientizeOptions.PORT)
			clientizeOptions.WEB_PORT = clientizeOptions.PORT;
		clientizeOptions.WEB_PROTOCOL = clientizeOptions.PROTOCOL;		
	};

	clientizeOptions.DB_OIOCOLLECTION = (process.env.CLIENTIZE_DB_OIOCOLLECTION 
			? process.env.CLIENTIZE_DB_OIOCOLLECTION : 'clientize' );
	clientizeOptions.DB_CONFIG = (process.env.CLIENTIZE_DB_CONFIG ? process.env.CLIENTIZE_DB_CONFIG : 'clientize-config');
	clientizeOptions.DB_APP = (process.env.CLIENTIZE_DB_APP ? process.env.CLIENTIZE_DB_APP : 'clientize-passthrough');
	clientizeOptions.DB_OIOKEY = (process.env.CLIENTIZE_DB_OIOKEY	? process.env.CLIENTIZE_DB_OIOKEY : generatekey([8], ''));
	clientizeOptions.PROXY_OIOKEY = (process.env.CLIENTIZE_PROXY_OIOKEY ?	process.env.CLIENTIZE_PROXY_OIOKEY
			: generatekey([8,4,4,4,12], '-'));
	clientizeOptions.PROXY_KEY = (process.env.CLIENTIZE_PROXY_KEY	? process.env.CLIENTIZE_PROXY_KEY : generatekey([8],''));
	clientizeOptions.DASHBOARD_LOGIN = (process.env.CLIENTIZE_DASHBOARD_LOGIN ? process.env.CLIENTIZE_DASHBOARD_LOGIN : 'clientizeit');
	clientizeOptions.DASHBOARD_KEY = (process.env.CLIENTIZE_DASHBOARD_KEY	? process.env.CLIENTIZE_DASHBOARD_KEY : generatekey([8], ''));
	clientizeOptions.DASHBOARD_OIOKEY = (process.env.CLIENTIZE_DASHBOARD_OIOKEY ? process.env.CLIENTIZE_DASHBOARD_OIOKEY
			: generatekey([8,4,4,4,12], '-'));

	// add the host and port if supplied
	if(process.env.CLIENTIZE_PROXY_HOST) {
		clientizeOptions.PROXY_HOST = process.env.CLIENTIZE_PROXY_HOST;
		if(process.env.CLIENTIZE_PROXY_PORT) 
			clientizeOptions.PROXY_PORT = process.env.CLIENTIZE_PROXY_PORT;
		clientizeOptions.PROXY_PROTOCOL = (process.env.CLIENTIZE_PROXY_PROTOCOL ? process.env.CLIENTIZE_PROXY_PROTOCOL : 'https');
	}
	else {
		clientizeOptions.PROXY_HOST = clientizeOptions.HOST;
		if(clientizeOptions.PORT)
			clientizeOptions.PROXY_PORT = clientizeOptions.PORT;
		clientizeOptions.PROXY_PROTOCOL = clientizeOptions.PROTOCOL;
	}
console.log(clientizeOptions);

	// These are the full reverse proxy configuration options
	var defaultOptions = {
		connection: {
			host: clientizeOptions.HOST,
			port: clientizeOptions.PORT,
			protocol: clientizeOptions.PROTOCOL
		},   
		web: {
			host: clientizeOptions.WEB_HOST,
			port: clientizeOptions.WEB_PORT,
			protocol: clientizeOptions.WEB_PROTOCOL
		},   
		proxy: {
			app: clientizeOptions.DB_APP,
			key: clientizeOptions.PROXY_KEY,
			routes: [{
				method: '*',
				path: '/'+ clientizeOptions.PROXY_HOST + '/' + clientizeOptions.DB_APP + '/{p*}',
//				protocol: 'https',
				protocol: clientizeOptions.PROXY_PROTOCOL,
				host: clientizeOptions.PROXY_HOST,
//    			port: null,				
				username: clientizeOptions.PROXY_OIOKEY,
//    			password: null,
				strip: true,
				prefix: '/'+ clientizeOptions.PROXY_HOST + '/' + clientizeOptions.DB_APP
			}]
		}
    };
	
	// add the upstream host port if supplied
	if(clientizeOptions.PROXY_PORT)
		defaultOptions.proxy.port = clientizeOptions.PROXY_PORT;
	
	// Add the info for the dashboard application proxy if it is provided
	// NOTE: Although we have default values we don't use them when environment values aren't supplied
	if(process.env.CLIENTIZE_DASHBOARD_KEY) {
		defaultOptions.dashboard = {
			app: 'clientize-dashboard',
			key: clientizeOptions.DASHBOARD_KEY,
			routes: [{
				method: 'GET',
				path: '/api.orchestrate.io/clientize-dashboard/v0',
				protocol: 'https',
				host: 'api.orchestrate.io',
//				port: null,				
				username: clientizeOptions.DASHBOARD_OIOKEY,
//				password: null,
				strip: true,
				prefix: '/api.orchestrate.io/clientize-dashboard'
			},
			{
				method: '*',
				path: Path.join('/api.orchestrate.io/clientize-dashboard/v0/',
						clientizeOptions.DB_OIOCOLLECTION, '{p*}'),
				protocol: 'https',
				host: 'api.orchestrate.io',
//	   			port: null,				
				username: clientizeOptions.DASHBOARD_OIOKEY,
//	   			password: null,
				strip: true,
				prefix: '/api.orchestrate.io/clientize-dashboard'
			}],
			login: clientizeOptions.DASHBOARD_LOGIN
		};
	}
	else {
		defaultOptions.dashboard = {
			login: clientizeOptions.DASHBOARD_LOGIN				
		};		
	};

	// Add the direct access info for the configuration DB 
	// NOTE: Although we have default values we don't use them when environment values aren't supplied
	if(process.env.CLIENTIZE_DB_OIOCOLLECTION && process.env.CLIENTIZE_DB_CONFIG
			&& process.env.CLIENTIZE_DB_APP && process.env.CLIENTIZE_DB_OIOKEY) {
		defaultOptions.db = {
			collection: clientizeOptions.DB_OIOCOLLECTION,
			config: clientizeOptions.DB_CONFIG,
			app: clientizeOptions.DB_APP,
			key: clientizeOptions.DB_OIOKEY				
		};
	};
	
	// Search for app object in configuration document
	function selectApp(doc, app) {
		try {
			for(var i=0; i<doc.apps.length; i++) {
				if(doc.apps[i].app === app)
					return doc.apps[i];
			}			
		}
		catch(e) {
			return;
		};
		
		return;
	};

	var db, rp, cdb, options;
	async.series([
	    function(callback) {
	    	if(defaultOptions.db) {
	    		db = oio(defaultOptions.db.key);
//	    		db.search(defaultOptions.db.collection, 'app:"' + defaultOptions.db.app + '"')
	    		db.get(defaultOptions.db.collection, defaultOptions.db.config)
	        	.then(function(result) {
	        		options = Hoek.clone(defaultOptions);
//	        		options.proxy = Hoek.clone(result.body.results[0].value);
	        		var app = selectApp(result.body, defaultOptions.db.app);
	        		if(app) {
	        			options.proxy = Hoek.clone(app);
	        			console.log('Retrieved proxy configuration:');
	        			console.log(JSON.stringify(options, null, '\t'));
	        			callback(null);
	        		}
	        		else {
	        			var err = 'App not found in application configuration document';
	        			console.log(err);
	        			callback(err);
	        		}
/*
	        	})
	        	.fail(function(err) {
	        		console.log('Could not retrieve proxy configuration');
	        		callback(err);
	        	});
*/
	        	}, function(err) {
	        		console.log('Could not retrieve proxy configuration');
	        		callback(err);
	        	});
	        }
	        else {
	        	options = defaultOptions;
	        	console.log('Using default proxy configuration:');
        		console.log(JSON.stringify(options, null, '\t'));
        		setImmediate(callback(null));
	        }
	    },
	    function(callback) {
	        rp = new ReverseProxy(options);
	    	rp.configure(function(err) {
	    		if(err) {
	    			console.log('Cannot create and configure reverse proxy server');
	    			callback(err);
	    		}
	    		else {
	    			console.log('Reverse-proxy server configured '
	    				+ (options.dashboard ? 'with dashboard' : 'without dashboard'));
	    			callback(null);
	    		};
	    	});    	
	    },
	    function(callback) {
	    	rp.start(function(err) {
	    		if(err) {
	    			console.log('Cannot start reverse-proxy server:');
	    			callback(err);
	    		}
	    		else {
	    			console.log('Reverse-proxy server started at ' + rp.server.info.uri);
	    			callback(null);
	    		};
	    	});    	
	    },
	    function(callback) {
	    	var opts = {
			    protocol: options.web.protocol,
			    host: options.web.host,
		        prefix: '/api.orchestrate.io/' + options.proxy.app,
		        token: { bearer: options.proxy.key }	    			
	    	};
	    	if(options.web.port)
	    		opts.port = options.web.port;

	        cdb = oio(opts);
	    	cdb.ping()
	    	.then(function() {
	    		console.log('Reverse-proxied host ping successful');
	    		callback(null);
/*
	    	})
	    	.fail(function(err) {
	    		console.log('Reversed-proxied host ping failed');
	    		console.log(err.body);
	    		callback(err);
	    	});
*/  	
	    	}, function(err) {
	    		console.log('Reversed-proxied host ping failed');
	    		console.log(err.body);
	    		callback(err);
	    	});
	    }
	], function(err, results) {
		if(err) {
			console.log('Failed to launch reverse-proxy server:');
			console.log(err);
		}
		else {
			console.log('Routing table:');
			console.log(rp.routes());
			console.log('Successfully launched reverse-proxy server');
		}
	});
}).call(this);
