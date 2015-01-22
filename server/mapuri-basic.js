/**
 *  MapURI function for Basic authentication of proxies to upstream servers
 */
;(function() {
	'use strict';
	var Hoek = require('hoek');

	function MapUriBasic(options) {
		var host = options.protocol + '://' + options.host;
			+ (typeof options.port !== 'undefined' ? ':' + options.port : '');

		var rhost;
		if(typeof options.prefix !== 'undefined')
			rhost = new RegExp('^' + options.prefix + '/');
		else
			rhost = new RegExp('^/' + options.host + (typeof options.port !== 'undefined' ? '-' + options.port : '') + '/');

		var auth = Hoek.base64urlEncode( (typeof options.username === 'string' ? options.username : '')
			+ ':' + (typeof options.password === 'string' ? options.password : '') );
//		var auth = (new Buffer( (typeof options.username === 'string' ? options.username : '') 
//			+ ':' + (typeof options.password === 'string' ? options.password : '') ).toString('base64');

		var headers = { 'Authorization': 'Basic ' + auth };

		var strip = options.strip;

		return function(request, callback) {
			var uri = host + (strip ? request.url.href.replace(rhost, '/') : request.url.href);
			console.log(strip);
			console.log(rhost);
			console.log(uri);
			callback(null, uri, headers);
		};
	};
	
	/*==========================================================================*/
	/* Export info																*/
	/*==========================================================================*/

	// AMD / RequireJS
	if (typeof define !== 'undefined' && define.amd) {
		define([], function() {
			return MapUriBasic;
		});
	}
	// Node.js
	else if (typeof module !== 'undefined' && module.exports) {
		module.exports = MapUriBasic;
	}
	// included directly via <script> tag
	else {
		this.MapUriBasic = MapUriBasic;
	}

}).call(this);