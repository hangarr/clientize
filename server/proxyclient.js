/**
 * An Orchestrate.io client for the Clientize reverse-proxy
 */
;(function() {
	'use strict';
	
	var Client = require('orchestrate')
	  ,	util = require('util')
	  , request = require('request')
	  , url = require('url')
	  , Q = require('kew')
	  , assert = require('assert')
	  , pjson = require('../package.json');

	/**
	 * Clientize Orchestrate.io client.
	 * 
	 * This does little more than wrap the Orchestrate.io with a derived client
	 * object that is configures to talk to the Clientize reverse proxy rather than
	 * directly to the Orchestrate.io API
	 * 
	 * @constructor
	 * @param {string} protocol (optional, default 'http')
	 * @param {string} proxy host name
	 * @param {number} proxy port (optional)
	 * @param {string} prefix (optional)
	 * @param {string} token (optional)
	 */

	util.inherits(ProxyClient, Client);
	function ProxyClient (options) {
		if (!(this instanceof ProxyClient)) {
			return new ProxyClient(options);
		};
		Client.call(this, ' ');

		this._protocol = 'https';
		this._host = Client.ApiEndPoint;
		if(typeof options === 'undefined')
			assert(token, 'API key or configuration object required.');
		else if(typeof options === 'string') {
			this._token = options;
			return;
		}
		
		/**
		 * API protocol
		 * @type {string}
		 * @protected
		 */
		if(typeof options.protocol === 'string') {
			assert(options.protocol === 'http' || options.protocol === 'https', 'API protocol must be "http" or "https"');
			this._protocol = options.protocol;
		};
		
		/**
		 * API endpoint either Orchestrate or a proxy
		 * @type {string}
		 * @protected
		 */
		if(typeof options.host !== 'undefined')
			this._host = options.host;
		
		/**
		 * API endpoint port
		 * @type {number}
		 * @protected
		 */
		if(typeof options.port !== 'undefined')
			this._port = options.port;
		
		/**
		 * API path prefix
		 * @type {string}
		 * @protected
		 */
		if(typeof options.prefix !== 'undefined')
			this._prefix = options.prefix;
		
		/**
		 * API token used for HTTP Authentication.
		 * @type {string}
		 * @protected
		 */
		if(typeof options.token !== 'undefined')
			this._token = options.token;
	};
	
	util.inherits(ProxyClient, Client);
	ProxyClient.prototype.constructor.value = ProxyClient;
	
	/**
	 * Inherited Api endpoint.
	 * @enum {string}
	 */
	ProxyClient.ApiEndPoint = Client.ApiEndPoint;

	/**
	 * Inherited Api version
	 * @enum {string}
	 */
	ProxyClient.ApiVersion = Client.ApiVersion;
	
	/**
	 * Proxy Api endpoint.
	 * @enum {string}
	 */
	ProxyClient.ProxyApiEndPoint = ProxyClient.ApiEndPoint;
	
	/**
	 * Proxy Api port
	 * @enum {number}
	 */
	ProxyClient.ProxyApiPort = null;
	

	/**
	 * Makes a request to the Orchestrate api.  The request will be set up with all
	 * the necessary headers (eg auth, content type, user agent, etc).
	 *
	 * @param {string} method The HTTP method for the request
	 * @param {string} url The full endpoint url (including query portion).
	 * @param {Object} data (optional) The body of the request (will be converted to json).
	 * @param {Object} header (optional) Any additional headers to go along with the request.
	 * @return {Promise}
	 * @protected
	 */
	ProxyClient.prototype._request = function (method, url, data, headers) {
		var defer = Q.defer();
		headers = headers || {};
		if (!headers['Content-Type']) headers['Content-Type'] = this.contentType;
		headers['User-Agent'] = this._userAgent;
/*
		request({
			method: method,
			url : url,
			auth: {user: this._token},
			headers: headers,
			body: JSON.stringify(data)
		}, defer.makeNodeResolver());
*/

		var opts = {
			method: method,
			url : url,
			headers: headers,
			body: JSON.stringify(data)
		};
		
		if(typeof this._token === 'string' && this._token.length > 0)
			opts.auth = {user: this._token};

		request(opts, defer.makeNodeResolver());

		return defer.promise
		.then(this._validateResponse.bind(this))
		.then(this._parseLinks.bind(this));
	};

	
	/**
	 * Generates and formats api url.
	 * @param {Array.<string>} path
	 * @param {Object} query
	 * @return {string}
	 */
	ProxyClient.prototype.generateApiUrl = function (path, query) {
		var href = Client.ApiEndPoint;
		var pathname = '';

		if (!path) path = [];

		for (var i = 0; i < path.length; i++)
			pathname += '/' + encodeURIComponent(path[i]);

		// Remove undefined key-value pairs.
		if (query)
			Object.keys(query).forEach(function (key) {
				if (query[key] == undefined)
					delete query[key];
			});
/*
		return url.format({
			protocol: 'https:',
			host: Client.ApiEndPoint + '/' + Client.ApiVersion,
			pathname: pathname,
			query: query
		});
*/ 
		var host = this._host + (typeof this._port !== 'undefined' ? ':' + this._port : '')
			+ (typeof this._prefix !== 'undefined' ? this._prefix : '')
			+ '/' + Client.ApiVersion;

		return url.format({
			protocol: this._protocol,
			host: host,
			pathname: pathname,
			query: query
		});
	};

	
	module.exports = ProxyClient;
}).call(this);