/**
 * hapi demo from project website
 * Launch the application by running "node demo.js" and point a browser at "localhost:8000/hello"
 */
var Hapi = require('hapi');

// Create a server with a host and port
var server = new Hapi.Server();
server.connection({ 
    host: 'localhost', 
    port: 8000 
});

// Add the route
server.route({
    method: 'GET',
    path:'/hello', 
    handler: function (request, reply) {
       reply('hello world');
    }
});

// Start the server
server.start(function(err) {
	if(err)
		console.log('err = ' + err);
	else
		console.log('Server started at: ' + server.info.uri);	
});
