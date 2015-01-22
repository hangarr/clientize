/**
 *  Verification function for Basic authorization of clientize API routes
 */
;(function() {
	'use strict';
	var Hoek = require('hoek');

	function ValidateBasic(options) {
		var optusername = options.username;
		var nousername = (typeof options.username === 'undefined');
		
		var optpassword = options.password;
		var nopassword = (typeof options.password === 'undefined');

		return function(username, password, callback) {
			var isValidUsername = nousername || (typeof username !== 'undefined' && optusername === username);
			var isValidPassword = nopassword || (typeof password !== 'undefined' && optpassword === password);

			var isValid = isValidUsername && isValidPassword;
			if(isValid) {
				if(typeof username === 'undefined') 
					callback( null, isValid, {} );
				else
					callback( null, isValid, { username: username } );
			}
			else
				callback( null, isValid );
		};
	};
	
	/*==========================================================================*/
	/* Export info																*/
	/*==========================================================================*/

	// AMD / RequireJS
	if (typeof define !== 'undefined' && define.amd) {
		define([], function() {
			return ValidateBasic;
		});
	}
	// Node.js
	else if (typeof module !== 'undefined' && module.exports) {
		module.exports = ValidateBasic;
	}
	// included directly via <script> tag
	else {
		this.ValidateBasic = ValidateBasic;
	}

}).call(this);