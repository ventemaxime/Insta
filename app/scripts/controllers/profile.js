'use strict';

/**
 * @ngdoc function
 * @name angularApp.controller:ProfileCtrl
 * @description
 * # ProfileCtrl
 * Controller of the angularApp
 */
var app = angular.module('angularApp')
	.controller('ProfileCtrl', function ($scope, $cookies, $rootScope, profileProvider) {
		profileProvider.getAllProfiles(function(allProfiles) { $scope.allProfiles = allProfiles; });
		profileProvider.getProfile(null, null, function(profile) { 
			$rootScope.me = profile; 
		});
		$scope.signin = {};
		$scope.connexion = {};
		$scope.inscriptionForm = {};

		$scope.inscription = function() {
			if(!$scope.inscriptionForm.$valid || $scope.signin.password !== $scope.signin.confirmationPassword) {
				console.log("Connexion échouée :");
				console.log($scope.inscriptionForm);
				return false;
			}
			else {
				profileProvider.addProfile($scope.signin, function(email) {
					$rootScope.me = $scope.signin;
					$rootScope.me.connected = true;
					profileProvider.insertCookie(email);
				}, function() {

				});
				return true;
			}
		};

		$scope.connexion = function() {
			profileProvider.checkProfile($scope.connexion.username, $scope.connexion.password, function(email) {
				profileProvider.getProfile(email, true, function(profile) {
					$rootScope.me = profile;
					$rootScope.me.connected = true;
					// $scope.me = $rootScope.me;
				});
			});
		};
	});

app.factory('profileProvider', function($rootScope, $cookies, $http) {
	let userURL = "https://nantestinyinsta.appspot.com/user";
	let $this = this;

	let profileProvider = {
		getProfile: function(force, insertCookie, success, error) {
			return new Promise((resolve, reject) => {
				let retour = null;
				let profile = {connected: false};
				let email = $cookies.get("connected");
				if(!email) {
					email = force;
				}
				if(email) {
					if(force) {
						retour = $http.get(userURL + "?mail=" + force);
					} else {
						retour = $http.get(userURL + "?mail=" + $cookies.get("connected"));
					}
					retour.then(function(json) {
						profile = profileProvider.JsonToProfile(json);
						profile = profile[email];
						profile.connected = true;
						if(insertCookie) {
							let expireDate = new Date();
							expireDate.setHours(expireDate.getHours() + 25);
							$cookies.put("connected", email, {expires: expireDate});
						}
						resolve(profile);
						if(typeof success == "function") {
							success(profile);
						}
					}, function() {
						reject();
						console.error("Oh no...");
						if(typeof error == "function") {
							error();
						}
					});
				} else {
					profile = {
						connected: false
					};

					if(typeof success == "function") {
						success(profile);
					}
				}
			});
		},
		insertCookie: function(email) {
			let expireDate = new Date();
			expireDate.setHours(expireDate.getHours() + 25);
			$cookies.put("connected", email, {expires: expireDate});
		},
		setProfile: function(newProfile, success, error) {
			return new Promise((resolve, reject) => {
				let result = $http.put(userURL + decompose(newProfile));
				result.then(function() {
					resolve();
					if(typeof success == "function") {
						success();
					}
				}, function() {
					reject();
					if(typeof error == "function") {
						error();
					}
				});
			});
		}, 
		addProfile: function(profile, success, error) {
			return new Promise((resolve, reject) => {
				let result = $http.post(userURL + decompose(profile));
				result.then(function() {
					resolve(profile.email);
					if(typeof success == "function") {
						success(profile.email);
					}
				}, function() {
					reject();
					if(typeof error == "function") {
						error();
					}
				});
			});
		},
		checkProfile: function(email, password, success, error) {
			return new Promise((resolve, reject) => {
				let retour = $http.get(userURL + "?mail=" + email + "&pass=" + password);
				retour.then(function(json) {
					if(json.data) {
						resolve(json.data.propertyMap.email);
						if(typeof success == "function") {
							success(json.data.propertyMap.email);
						}
					} else {
						reject();
						if(typeof error == "function") {
							error();
						}
					}
				}, function() {
					reject();
					console.error("Oh non...");
					if(typeof error == "function") {
						error();
					}
				});
			});
		},
		getAllProfiles: function(success, error) {
			return new Promise((resolve, reject) => {
				let retour = $http.get(userURL + "?sendAll=1");
				retour.then(function(json) {
					let users = [];
					for(let user of json.data) {
						users.push(user.propertyMap);
					}
					resolve(users);
					if(typeof success == "function") {
						success(users);
					}
				}, function() {
					reject();
					console.log("Oh... error");
					if(typeof error == "function") {
						error();
					}
				});
			});
		},
		disconnect: function() {
			$cookies.remove("connected");
			return {connected: false};
		},
		JsonToProfile: function(json, indexOfData) {
			let data = json.data;
			if(indexOfData !== undefined) {
				data = data[indexOfData];
			} else {
				try {
					let x = {};
					x[data.propertyMap.email] = data;
					data = x;
				} catch(e) {
					
				}
			}
			data = data;
			let profiles = {};
			for(let profile in data) {
				let profileID = profile;
				profile = data[profile].propertyMap;
				let likes = getEntityValue(profile.likes);
				if(likes) {
					likes = likes.split(";");
					if(likes[likes.length -1] === "") {
						likes = likes.pop();
					}
				} else {
					likes = [];
				}
				let following = getEntityValue(profile.followings);
				if(following) {
					following = following.split(";");
					if(following[following.length -1] === "") {
						following = following.pop();
					}
				} else {
					following = [];
				}
				let canFollow = false;
				if($rootScope.me !== undefined && $rootScope.me.connected === true && 
					$rootScope.me.email != getEntityValue(profile.email) && 
					!$rootScope.me.followings.includes(getEntityValue(profile.email))) {
					canFollow = true;
				}
				let obj = {
					email: getEntityValue(profile.email),
					firstname: getEntityValue(profile.firstname),
					lastname: getEntityValue(profile.lastname),
					password: getEntityValue(profile.password),
					pseudo: getEntityValue(profile.pseudo),
					postCount: getEntityValue(profile.postsCount),
					followersCount: getEntityValue(profile.followersCount),
					followings: following,
					likes: likes,
					canFollow: canFollow,
				};
				profiles[profileID] = obj;
			}
			return profiles;
		},
		follow: function(follower, following, success, error) {
			return new Promise((resolve, reject) => {
				let retour = $http.post("https://nantestinyinsta.appspot.com/follower?follower=" + follower.email + "&following=" + following.email);
				retour.then(function(json) {
					resolve();
					if(typeof success == "function") {
						success();
					}
				}, function() {
					reject();
					console.log("Oh... error");
					if(typeof error == "function") {
						error();
					}
				});
			});
		}
	};
	return profileProvider;
});