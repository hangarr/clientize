/**
 * hapi demo from project website
 * Launch the application by running "node demo.js" and point a browser at "localhost:8000/hello"
 */
/**
 * 
curl https://api.orchestrate.io/v0/api-access/$key \
-X PUT \
-H 'Content-Type:application/json' \
-u '12345678-1234-1234-1234-123456789012:' \
-d '{"name": "Kate Robbins", "hometown": "Portland, OR", "twitter": "@katesfaketwitter"}'
*
curl https://api.orchestrate.io/v0/api-access/$key \
-X GET \
-u '12345678-1234-1234-1234-123456789012:'
*
curl -i "https://api.orchestrate.io/v0/api-access/kates-user-id" \
  -XPATCH \
  -H 'Content-Type: application/json-patch+json' \
  -u '$api_key' \
  -d '[{ "op": "add", "path": "favorite_food", "value": "Pizza" }]'
 */
;(function() {
	var Path = require('path')
	  , Hapi = require('hapi')
	  , Hoek = require('hoek')
	  , request = require('request')
	  , url = require('url')
	  , Q = require('kew')
	  , assert = require('assert')
	  , pjson = require('./package.json')
	  , db = require('orchestrate')(process.env.CLIENTIZE_OIOKEY)
	  , Endpoint = require('./server/endpoint.js')
	  , HapiAuthBasic = require('hapi-auth-basic')
	  , ValidateBasic = require('./server/validate-basic')
	  , MapUriBasic = require('./server/mapuri-basic');

	// Generate an clientizeAPI key
	var clientizeKey = Endpoint.generateKey([3,5,2], '_');
	console.log(clientizeKey);
	console.log(Hoek.base64urlEncode(clientizeKey + ':'));

	// Create a server with a host and port
	var server = new Hapi.Server();
	server.app.userAgent = 'clientize.js/' + pjson.version + ' (Rick Hangartner; hapi proxy server)';
	server.app.apiKey = process.env.CLIENTIZE_OIOKEY;
	server.app.apiHost = process.env.CLIENTIZE_OIOHOST;
	server.app.apiAuthorization = Hoek.base64urlEncode(server.app.apiKey);
//	server.app.apiAuthorization = (new Buffer(server.app.apiKey)).toString('base64');

	server.connection({ 
		host: 'localhost', 
		port: 8000 
	});

	// Add the routes
	server.route({
		method: 'GET',
		path:'/hello', 
		handler: function (request, reply) {
			reply('hello world');
		}
	});
/*
	server.route({
		method: 'GET',
		path:'/{p*}', 
		handler: {
			proxy: {
//				uri: 'https://api.orchestrate.io/v0/api-access/test1',
				protocol: 'https',
				host: 'api.orchestrate.io',
				passThrough: true,
				xforward: false
			}
		},
		config: {
			cors: true
		}
	});
*/
/*
	server.route({
		method: 'GET',
		path: '/{p*}', 
		handler: {
			proxy: {
				mapUri: function(request, callback) {
					var uri = 'https://api.orchestrate.io' + request.url.href;
					var headers = { 'Authorization' : 'Basic ' + server.app.apiAuthorization };
					callback(null, uri, headers);
				},
				passThrough: true,
				xforward: false
			}
		},

		config: {
			cors: true
		}
	});
*/
	server.register( HapiAuthBasic, function (err) {
		
		server.auth.strategy('apibasic', 'basic', {
			validateFunc: ValidateBasic({
				username: clientizeKey
			}),
			allowEmptyUserName: true
		});

		server.route({
			method: 'GET',
			path: '/{p*}', 
			handler: {
				proxy: {
					mapUri: MapUriBasic({
						protocol: 'https',
						host: 'api.orchestrate.io',
						username: server.app.apiKey,
						strip: true
					}),
					passThrough: true,
					xforward: false
				}
			},
			config: {
				auth: 'apibasic',
				cors: true
			}
		});
	
	});

	// Start the server
	server.start(function(err) {
		if(err)
			console.log('err = ' + err);
		else
			console.log('Server started at: ' + server.info.uri);	
	});

}).call(this);
