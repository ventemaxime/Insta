'use strict';

function getCurrentUserSync() {

}

function decompose(entity) {
	let url = "?";
	for(let key in entity) {
		if(entity[key] !== undefined) {
			url += key + "=" + entity[key] + "&";
		}
	}
	return url.slice(0, -1); // remove last "&"
}

    //you need this function to convert the dataURI
function dataURItoBlob(dataURI) {
	var binary = atob(dataURI.split(',')[1]);
	var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
	var array = [];
	for (var i = 0; i < binary.length; i++) {
		array.push(binary.charCodeAt(i));
	}
	return new Blob([new Uint8Array(array)], {
		type: mimeString
	});
}

function scaleImage(dataUrl, scaleRatio, imageType, imageArguments, callback) {
    var image, oldWidth, oldHeight, newWidth, newHeight, canvas, ctx, newDataUrl;

    // Provide default values
    imageType = imageType || "image/jpeg";
    imageArguments = imageArguments || 0.7;

    // Create a temporary image so that we can dimensions of new image.
    image = new Image();
    image.onload = function() {
      oldWidth = image.width;
      oldHeight = image.height;
      newWidth = Math.floor(oldWidth * scaleRatio);
      newHeight = Math.floor(oldHeight * scaleRatio);

      // Create a temporary canvas to draw the downscaled image on.
      canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw the scaled image on the canvas and trigger the callback function.
      ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, newWidth, newHeight);
      newDataUrl = canvas.toDataURL(imageType, imageArguments);
      callback(newDataUrl);
    };
    image.src = dataUrl;
}

function getEntityValue(value) {
	if(value === undefined) { 
		return null;
	}
	if(value.value !== undefined) {
		return getEntityValue(value.value);
	}
	return value;
}

function JsonToArray(json_data) {
	let result = [];
	for(var i in json_data) {
	    result.push(json_data [i]);
	}
	return result;
}

/**
 * @ngdoc overview
 * @name angularApp
 * @description
 * # angularApp
 *
 * Main module of the application.
 */
var app = angular
	.module('angularApp', [
		'ngAnimate',
		'ngAria',
		'ngCookies',
		'ngMessages',
		'ngResource',
		'ngRoute',
		'ngSanitize',
		'ngTouch',
		'mgcrea.ngStrap',
		'ui.bootstrap'
	])
	.config(function ($routeProvider) {
		$routeProvider
			.when('/home', {
				templateUrl: 'views/main.html',
				controller: 'MainCtrl',
				controllerAs: 'main'
			})
			.when('/post', {
				templateUrl: 'views/post.html',
				controller: 'PostCtrl',
				controllerAs: 'post'
			})
			.when('/profile', {
				templateUrl: 'views/profile.html',
				controller: 'ProfileCtrl',
				controllerAs: 'profile'
			})
			.when('/about', {
				templateUrl: 'views/about.html',
				controller: 'AboutCtrl',
				controllerAs: 'about'
			})
			.when('/contact', {
				templateUrl: 'views/contact.html',
				controller: 'ContactCtrl',
				controllerAs: 'contact'
			})
			.when('/search', {
				templateUrl: 'views/search.html',
				controller: 'SearchCtrl',
				controllerAs: 'search'
			})
			.otherwise({
				redirectTo: '/home'
			});
	});
app.controller("appController", function($rootScope, $window, profileProvider) {
	$rootScope.appName = "Instantes";
	$rootScope.ApiURL = "https://nantestinyinsta.appspot.com/";
	profileProvider.getProfile(false, true, function(profile) {
		$rootScope.me = profile;
	}).catch(e => {
		$window.location.href = '#!/profile';
	});

	$rootScope.disconnectUser = function() {
		$rootScope.me = profileProvider.disconnect();
		return;
	};

	$rootScope.follow = function(user) {
		profileProvider.follow($rootScope.me, user).then(function() {
			console.log("Followed!");
		});
	};
	$rootScope.stopFollowUser = function(user) {

	};
	$rootScope.search = function(query) {
		$rootScope.searchQuery = query;
		$window.location.href = "#!/search";
	};
});

app.directive("fileread", [function () {
		return {
				scope: {
						fileread: "="
				},
				link: function (scope, element, attributes) {
						element.bind("change", function (changeEvent) {
								scope.$apply(function () {
									scope.fileread = changeEvent.target.files[0];
									var reader = new FileReader();
									reader.onload = function (loadEvent) {
											scope.$apply(function () {
													scope.fileread.data = loadEvent.target.result;
											});
									};
									reader.readAsDataURL(changeEvent.target.files[0]);
								});
						});
				}
		};
}]);