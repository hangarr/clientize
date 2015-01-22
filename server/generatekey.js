/**
 * Generates random API keys
 *
 * @param {Array} list of integers specifying number of characters in each key segment
 * @param {string} separator between key segments
 */
;(function() {
	'use strict';
	var Hoek = require('hoek');
	
	// parts is either an single integer or an array of integers
	var alphanum = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	function generateKey(parts, sep) {
		Hoek.assert(typeof parts === 'number' || (Array.isArray(parts) && parts.length > 0), 
			'"parts" must be a number or an array of numbers');
		Hoek.assert(typeof sep === 'string', '"sep" must be a character');
		
		var keyp = [];
		var a = (typeof parts === 'number' ? [parts] : parts);
		for(var i=0; i<a.length; i++) {
			Hoek.assert(typeof a[i] === 'number' && a[i] > 1, 
				'"parts" must be positive integer or an array of positive integers');
			var fa = Math.floor(a[i]);
			var p = '';
			for(var j=0; j<fa; j++)
				p += alphanum.charAt(Math.floor(Math.random() * alphanum.length));
			keyp.push(p);
		}
		
		if(typeof sep === 'undefined')
			return keyp[0];
		else
			return keyp.join(sep.slice(0,1));
	};
	
	
	/*==========================================================================*/
	/* Export info																*/
	/*==========================================================================*/

	// AMD / RequireJS
	if (typeof define !== 'undefined' && define.amd) {
		define([], function() {
			return generateKey;
		});
	}
	// Node.js
	else if (typeof module !== 'undefined' && module.exports) {
		module.exports = generateKey;
	}
	// included directly via <script> tag
	else {
		this.generateKey = generateKey;
	}

}).call(this);