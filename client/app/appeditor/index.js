/**
 * AngularJS  angular.module wrapper for AppEditorCtrl controller function
 */
;(function() {
	'use strict';
	
	var angular = window.angular;

	var appeditorCtrl = require('./appeditorCtrl.js');
	
	var rpappAppEditor = angular.module('rpapp.appeditor', [])
		.controller( 'AppEditorCtrl', appeditorCtrl );

	module.exports = rpappAppEditor;
}).call(this);