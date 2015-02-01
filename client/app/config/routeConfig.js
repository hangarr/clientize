/**
 * 
 */
;(function() {
	'use strict';
	
	var angular = window.angular;

	function routeConfig($routeProvider, $locationProvider) {
//		$locationProvider.hashPrefix('!');
		$locationProvider.html5Mode(true);
		$routeProvider.
		when('/', {
			templateUrl: 'public/templates/options.html'
		}).
		when('/apps', {
			templateUrl: 'public/templates/appeditor.html',
			reloadOnSearch: true,
//			controller: 'AppEditorCtrl'
		}).
		otherwise({
			redirectTo: '/'
		});
	};	
	
	module.exports = routeConfig;
}).call(this);