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
	  , request = require('request')
	  , url = require('url')
	  , Q = require('kew')
	  , assert = require('assert')
	  , pjson = require('./package.json')
	  , db = require('orchestrate')(process.env.OIOKEY_CLIENTIZE);

	// Create a server with a host and port
	var server = new Hapi.Server();
	server.app.userAgent = 'clientize.js/' + pjson.version + ' (Rick Hangartner; hapi proxy server)';
	server.app.apiKey = process.env.CLIENTIZE_OIOKEY;
	server.app.apiHost = process.env.CLIENTIZE_OIOHOST;

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

	server.route({
		method: 'GET',
		path:'/{p*}', 
/*
		handler: function (request, reply) {
			var ropts = {	
			    method: raw.request.method,
			    url: path.join(this.apiHost, raw.request.url),
			    auth: {user: this.apiKey},
			    headers: raw.request.headers,
			};
			if(raw.request.rawBody)
				ropts.body = raw.request.rawBody;
			request(ropts, function(err, httpResponse, body){
				
			});
		},
*/
		handler: {
			proxy: {
//				url: 'https://api.orchestrate.io'
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

	// Start the server
	server.start(function(err) {
		if(err)
			console.log('err = ' + err);
		else
			console.log('Server started at: ' + server.info.uri);	
	});

}).call(this);
