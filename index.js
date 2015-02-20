/**
 * Reverse proxy demo
 */
/**
 * CLIENTIZE_HOST				= Name of clientize proxy host (optional)
 * CLIENTIZE_PORT				= Host port (optional)
 * CLIENTIZE_DB_OIOCOLLECTION	= Orchestrate.io collection for configuration storage
 * CLIENTIZE_DB_CONFIG			= Name of reverse-proxy configuration doc in CLIENTIZE_DB_OIOCOLLECTION
 * CLIENTIZE_DB_APP				= Name of reverse-proxy configuration app in CLIENTIZE_DB_CONFIG doc
 * CLIENTIZE_DB_OIOKEY			= Orchestrate.io API key for reverse-proxy configuration storage
 * CLIENTIZE_PROXY_OIOKEY		= Orchestrate.io API key for reverse-proxy
 * CLIENTIZE_PROXY_KEY			= Client application key for reverse-proxy
 * CLIENTIZE_PROXY_HOST			= Default upstream host
 * CLIENTIZE_PROXY_PORT			= Default upstream host port
 * CLIENTIZE_DASHBOARD_LOGIN	= Client dashboard application login password
 * CLIENTIZE_DASHBOARD_KEY		= Client application key for Orchestrate.io configuration storage
 * CLIENTIZE_DASHBOARD_OIOKEY	= Orchestrate.io API key for configuration storage (CLIENTIZE_DB_OIOKEY)
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
	  , oio = require('clientize-orchestrate');

	var clientizeOptions = {
		HOST: (process.env.CLIENTIZE_HOST ? process.env.CLIENTIZE_HOST : 'localhost'),
		PORT: (process.env.CLIENTIZE_PORT ? process.env.CLIENTIZE_PORT : 8000),
		DB_OIOCOLLECTION: (process.env.CLIENTIZE_DB_OIOCOLLECTION 
							? process.env.CLIENTIZE_DB_OIOCOLLECTION : 'clientize' ),
		DB_CONFIG: (process.env.CLIENTIZE_DB_CONFIG ? process.env.CLIENTIZE_DB_CONFIG : 'clientize-config'),
		DB_APP: (process.env.CLIENTIZE_DB_APP ? process.env.CLIENTIZE_DB_APP : 'clientize-passthrough'),
		DB_OIOKEY: (process.env.CLIENTIZE_DB_OIOKEY	? process.env.CLIENTIZE_DB_OIOKEY : generatekey([8], '')),
		PROXY_OIOKEY: (process.env.CLIENTIZE_PROXY_OIOKEY ?	process.env.CLIENTIZE_PROXY_OIOKEY
						: generatekey([8,4,4,4,12], '-')),
		PROXY_KEY: (process.env.CLIENTIZE_PROXY_KEY	? process.env.CLIENTIZE_PROXY_KEY : generatekey([8],'')),
		DASHBOARD_LOGIN: (process.env.CLIENTIZE_DASHBOARD_LOGIN ? process.env.CLIENTIZE_DASHBOARD_LOGIN : 'clientizeit'),
		DASHBOARD_KEY: (process.env.CLIENTIZE_DASHBOARD_KEY	? process.env.CLIENTIZE_DASHBOARD_KEY : generatekey([8], '')),
		DASHBOARD_OIOKEY: (process.env.CLIENTIZE_DASHBOARD_OIOKEY ? process.env.CLIENTIZE_DASHBOARD_OIOKEY
							: generatekey([8,4,4,4,12], '-'))
	};

	// add the host and port if supplied
	if(process.env.CLIENTIZE_PROXY_HOST) {
		clientizeOptions.PROXY_HOST = process.env.CLIENTIZE_PROXY_HOST;
		if(process.env.CLIENTIZE_PROXY_PORT) 
			clientizeOptions.PROXY_PORT = process.env.CLIENTIZE_PROXY_PORT;
	}
	else {
		clientizeOptions.PROXY_HOST = clientizeOptions.HOST;
		clientizeOptions.PROXY_PORT = clientizeOptions.PORT;
	}
console.log(clientizeOptions);

	// These are the full reverse proxy configuration options
	var defaultOptions = {
		connection: {
			host: clientizeOptions.HOST,
			port: clientizeOptions.PORT
		},   
		proxy: {
			app: clientizeOptions.DB_APP,
			key: clientizeOptions.PROXY_KEY,
			routes: [{
				method: '*',
				path: '/'+ clientizeOptions.PROXY_HOST + '/' + clientizeOptions.DB_APP + '/{p*}',
				protocol: 'https',
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
