;(function() {
	'use strict';
	
//	var ng = require('angular')
	var angular = window.angular;

	var dashboardCtrl = require('./dashboardCtrl.js');
	
	var rpappDashboard = angular.module('rpapp.dashboard', [])
		.controller( 'DashboardCtrl', dashboardCtrl );

	module.exports = rpappDashboard;
}).call(this);