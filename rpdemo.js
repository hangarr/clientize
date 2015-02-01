/**
 * Reverse proxy demo
 */
/**
 * CLIENTIZE_HOST				= Name of clientize proxy host (optional)
 * CLIENTIZE_PORT				= Host port (optional)
 * CLIENTIZE_DB_OIOCOLLECTION	= Orchestrate.io collection for configuration storage
 * CLIENTIZE_DB_APP				= Name of reverse-proxy configuration doc in CLIENTIZE_DB_OIOCOLLECTION
 * CLIENTIZE_DB_OIOKEY			= Orchestrate.io API key for reverse-proxy configuration storage
 * CLIENTIZE_PROXY_OIOKEY		= Orchestrate.io API key for reverse-proxy
 * CLIENTIZE_PROXY_KEY			= Client application key for reverse-proxy
 * CLIENTIZE_DASHBOARD_LOGIN	= Client dashboard application login password
 * CLIENTIZE_DASHBOARD_KEY		= Client application key for Orchestrate.io configuration storage
 * CLIENTIZE_DASHBOARD_OIOKEY	= Orchestrate.io API key for configuration storage (CLIENTIZE_DB_OIOKEY)
 */
;(function() {
	'use strict';
	process.env.PROJECT_DIR = __dirname;

	var Hoek = require('hoek')
	  ,	ReverseProxy = require('./server/reverseproxy')
	  ,	Path = require('path')
	  , assert = require('assert')
	  , async = require('async')
	  , oio = require('clientize-orchestrate');
//	  , oio = require('./server/proxyclient');
//	  , oio = require('orchestrate');

	var defaultOptions = {
		connection: {
			host: (process.env.CLIENTIZE_HOST ? process.env.CLIENTIZE_HOST : 'localhost'),
			port: (process.env.CLIENTIZE_PORT ? parseInt(process.env.CLIENTIZE_PORT) : 8000),
		},   
		proxy: {
			app: 'clientize-passthrough',
			key: process.env.CLIENTIZE_PROXY_KEY,
			routes: [{
				method: 'GET',
				path: '/{p*}',
				protocol: 'https',
				host: 'api.orchestrate.io',
//    			port: null,				
				username: process.env.CLIENTIZE_PROXY_OIOKEY,
//    			password: null,
				strip: true,
				prefix: '/api.orchestrate.io/clientize-passthrough'
			}]
		}
    };
	
	// add the dashboard section if it is provided
	if(process.env.CLIENTIZE_DASHBOARD_KEY) {
		defaultOptions.dashboard = {
			app: 'clientize-dashboard',
			key: process.env.CLIENTIZE_DASHBOARD_KEY,
			routes: [{
				method: 'GET',
				path: '/api.orchestrate.io/clientize-dashboard/v0',
				protocol: 'https',
				host: 'api.orchestrate.io',
//			    port: null,				
				username: process.env.CLIENTIZE_DASHBOARD_OIOKEY,
//			    password: null,
				strip: true,
				prefix: '/api.orchestrate.io/clientize-dashboard'
			},
			{
				method: '*',
				path: Path.join('/api.orchestrate.io/clientize-dashboard/v0/',
						process.env.CLIENTIZE_DB_OIOCOLLECTION, '{p*}'),
				protocol: 'https',
				host: 'api.orchestrate.io',
//   			port: null,				
				username: process.env.CLIENTIZE_DASHBOARD_OIOKEY,
//   			password: null,
				strip: true,
				prefix: '/api.orchestrate.io/clientize-dashboard'
			}]
		};
		if(process.env.CLIENTIZE_DASHBOARD_LOGIN)
			defaultOptions.dashboard.login = process.env.CLIENTIZE_DASHBOARD_LOGIN;
	}

	// add the configuration DB section if provided
	if(process.env.CLIENTIZE_DB_OIOCOLLECTION && process.env.CLIENTIZE_DB_APP && process.env.CLIENTIZE_DB_OIOKEY) {
		defaultOptions.db = {
			collection: process.env.CLIENTIZE_DB_OIOCOLLECTION,
			app: process.env.CLIENTIZE_DB_APP,
			key: process.env.CLIENTIZE_DB_OIOKEY				
		};
	};

	var db, rp, cdb, options;
	async.series([
	    function(callback) {
	    	if(defaultOptions.db) {
	    		db = oio(defaultOptions.db.key);
	    		db.search(defaultOptions.db.collection, 'app:"' + defaultOptions.db.app + '"')
	        	.then(function(result) {
	        		options = Hoek.clone(defaultOptions);
	        		options.proxy = Hoek.clone(result.body.results[0].value);
		    		console.log('Retrieved proxy configuration:');
	        		console.log(JSON.stringify(options, null, '\t'));
	        		callback(null);
	        	})
	        	.fail(function(err) {
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
	        cdb = oio({
	        	protocol: 'http',
	        	host: options.connection.host,
	        	port: options.connection.port,
	        	prefix: '/api.orchestrate.io/' + options.proxy.app,
//	        	token: options.proxy.key + ':'
	        	token: { bearer: options.proxy.key }
	        });
	    	cdb.ping()
	    	.then(function() {
	    		console.log('Reverse-proxied host ping successful');
	    		callback(null);
	    	})
	    	.fail(function(err) {
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
