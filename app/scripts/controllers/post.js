'use strict';

/**
 * @ngdoc function
 * @name angularApp.controller:PostCtrl
 * @description
 * # PostCtrl
 * Controller of the angularApp
 */
var app = angular.module('angularApp')
  .controller('PostCtrl', function ($scope, $rootScope, postFactory) {
	$scope.newPost = {displayPreview: false};

	$scope.save = function(newPost) {
		newPost.author = $rootScope.me.email;
		newPost.date = Date.now();
		newPost.id = "" + newPost.author + "" + newPost.date;
		newPost.likes = 0;
		newPost.messagesCount = 0;
		scaleImage(newPost.image.data, 0.5, newPost.image.type, 0.01, function(newDataUrl) {
			newPost.photoLink = newDataUrl;
			postFactory.addPost(newPost, function() {
			});
			$scope.newPost = {displayPreview: false};
		});
	};
  });

app.factory('postFactory', function($rootScope, $cookies, $http, profileProvider) {
	let postURL = "https://nantestinyinsta.appspot.com/post";
	let $this = this;
	var postFactory = {

		setPost: function(newPost, success, error) {
			return new Promise((resolve, reject) => {
				let result = $http.put(postURL + decompose(newPost));
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
		addPost: function(post, success, error) {
			return new Promise((resolve, reject) => {
				let result = $http.post(postURL + postFactory.decomposeWithoutImage(post), postFactory.PostToJson(post).image, {
					    transformRequest: angular.identity,
					    headers: {
					        'Content-Type': undefined
					    }});
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
		getLatestPosts: function(offset, user, success, error) {
			return new Promise((resolve, reject) => {
				let result = $http.get(postURL + "?offset=" + offset[0] + "&limit=" + offset[1] + "&user=" + user);
				result.then(function(json) {
					let posts = postFactory.JsonToPost(json, 0);
					let users = profileProvider.JsonToProfile(json, 1);
					for(let postID in posts) {
						posts[postID].author = users[posts[postID].author];
					}
					resolve(posts, offset + json.data.numberOfPosts);
					if(typeof success == "function") {
						success(posts, offset + json.data.numberOfPosts);
					}
				}, function() {
					reject();
					if(typeof error == "function") {
						error();
					}
				});
			});
		},
		like: function(userId, postId, success, error) {
			return new Promise((resolve, reject) => {
				let result = $http.post(postURL + "_like" + "?user=" + userId + "&post=" + postId);
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
		JsonToPost: function(json, indexOfData) {
			let data = json.data;
			if(indexOfData !== undefined) {
				data = data[indexOfData];
			}
			data = data;
			let posts = {};
			for(let post in data) {
				let postID = post;
				post = data[postID].propertyMap;
				let date = new Date(post.date);
				let canLike = false;

				if($rootScope.me) {
					if($rootScope.me.connected === true && post.id !== undefined) {
						canLike = !$rootScope.me.likes.includes(post.id);
					}
				}
				let obj = {
					id: getEntityValue(post.id),
					author: getEntityValue(post.author),
					photoLink: getEntityValue(post.image),
					image: getEntityValue(post.image),
					date: date,
					title: getEntityValue(post.title),
					description: getEntityValue(post.description),
					likes: getEntityValue(post.likes),
					commentCount: getEntityValue(post.commentCount),
					showComments: false,
					canLike: canLike,
					showProfile: false,
				};
				posts[postID] = obj;
			}
			return posts;
		},
		PostToJson: function(post) {
			let json = {
				id: getEntityValue(post.id),
				author: getEntityValue(post.author),
				title: getEntityValue(post.title),
				image: getEntityValue(post.photoLink),
				date: getEntityValue(post.date),
				description: getEntityValue(post.description),
				likes: getEntityValue(post.likes),
				commentCount: getEntityValue(post.commentCount),
				messages: getEntityValue(post.messages),
				showComments: false,
				canLike: getEntityValue(post.canLike)
			};
			return json;
		},
		decomposeWithoutImage: function(post) {
			let copy = {...post};
			delete copy.image;
			delete copy.photoLink;
			return decompose(copy);
		},
		getComments: function(post, success, error) {
			return new Promise((resolve, reject) => {
				let result = $http.get(postURL + "_comment" + "?post=" + post.id);
				result.then(function(json) {
					let comments = postFactory.JsonToComment(json, 0);
					let users = profileProvider.JsonToProfile(json, 1);
					for(let commentID in comments) {
						comments[commentID].author = users[comments[commentID].author];
						comments[commentID].isOP = (post.author.email == comments[commentID].author.email);
					}
					resolve(comments);
					if(typeof success == "function") {
						success(comments);
					}

				}, function() {
					reject();
					if(typeof error == "function") {
						error();
					}
				});
			});
		},
		JsonToComment: function(json, indexOfData) {
			let data = json.data;
			if(indexOfData !== undefined) {
				data = data[indexOfData];
			} else {
				let x = {};
				x[data.propertyMap.date] = data;
				data = x;
			}
			data = data;
			let comments = {};
			for(let comment in data) {
				let commentID = comment;
				comment = data[commentID].propertyMap;
				let date = new Date(getEntityValue(comment.date));
				let obj = {
					author: getEntityValue(comment.author),
					date: date,
					message: getEntityValue(comment.message),
					post: getEntityValue(comment.post),
					showProfile: false
				};
				comments[commentID] = obj;
			}
			return comments;
		},
		comment: function(post, comment, success, error) {
			return new Promise((resolve, reject) => {
				let result = $http.post(postURL + "_comment" + "?post=" + post.id + "&user=" + $rootScope.me.email + "&comment=" + comment);
				result.then(function(comment) {
					if(post.comments === undefined) {
						post.comments = [];
					}
					comment = postFactory.JsonToComment(comment);
					comment.author = $rootScope.me.pseudo;
					post.comments[post.commentCount.toString()] = comment[Object.keys(comment)[0]];
					post.commentCount ++;
					resolve(comment);
					if(typeof success == "function") {
						success(comment);
					}

				}, function() {
					reject();
					if(typeof error == "function") {
						error();
					}
				});
			});
		}

/*

		getPost: function(id , success, error) {
			let retour = null;
			let post = {};
			if($cookies.get("connected") || force) {
				if(force) {
					retour = $http.get(postURL + "?pseudo=" + force);
				} else {
					retour = $http.get(postURL + "?pseudo=" + $cookies.get("connected"));
				}
				retour.then(function(json) {
					post = json.data.propertyMap;
					post.connected = true;
					if(insertCookie) {
						let expireDate = new Date();
						expireDate.setHours(expireDate.getHours() + 25);
						$cookies.put("connected", post.pseudo, {expires: expireDate});
					}
					if(typeof success == "function") {
						success(post);
					}
				}, function() {
					console.error("Oh no...");
					if(typeof error == "function") {
						error();
					}
				});
				// for(let prof of posts) {
				// 	if(prof.id == $cookies.get("connected") || prof.id == force) {
				// 		post = prof;
				// 		post.connected = true;
				// 	}
				// }
			} else {
				post = {
					connected: false
				};

				if(typeof success == "function") {
					success(post);
				}
			}
		},*/
	};
	return postFactory;
});