'use strict';

/**
 * @ngdoc function
 * @name angularApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the angularApp
 */
var app = angular.module('angularApp')
  .controller('SearchCtrl', function ($scope, $rootScope, SearchFactory) {
  	$scope.users = {}
  	$scope.posts = {};
  	SearchFactory.getSearchResults($rootScope.searchQuery, function(users, posts) {
  		$scope.posts = posts;
  		$scope.users = users;
  	});

	$scope.displayUserInfo = function(user) {
		if(user.showInfos === undefined) {
			user.showInfos = false;
		}
		user.showInfos = !user.showInfos;
	};
  });

app.factory('SearchFactory', function($http, profileProvider, postFactory) {
	let searchURL = "https://nantestinyinsta.appspot.com/search";
	let SearchFactory = {
		getSearchResults: function(query, success, error) {
			return new Promise((resolve, reject) => {
				let result = $http.get(searchURL + "?search=" + query);
				result.then(function(json) {
					let users = profileProvider.JsonToProfile(json, 0);
					let posts = postFactory.JsonToPost({data: json.data[1][0]});
					let authors = profileProvider.JsonToProfile({data: json.data[1][1]});
					for(let postID in posts) {
						posts[postID].author = authors[posts[postID].author];
					}
					resolve(users, posts);
					if(typeof success == "function") {
						success(users, posts);
					}
				});
			});
		},
	};

	return SearchFactory;
});