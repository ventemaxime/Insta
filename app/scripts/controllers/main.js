'use strict';

/**
 * @ngdoc function
 * @name angularApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the angularApp
 */
angular.module('angularApp')
  .controller('MainCtrl', function ($scope, $rootScope, postFactory, profileProvider) {
  		let content = () => {
			$scope.offset = [0, 10];
			let viewer = null;
			if($rootScope.me.connected) {
				viewer = $rootScope.me.email;
			}
			postFactory.getLatestPosts($scope.offset, viewer, function(posts, x) {
				posts = JsonToArray(posts).sort((a, b) => {
					if(a.date > b.date) {
						return -1;
					} else {
						return 1;
					}
				});
				$scope.posts = posts;
				$scope.offset[0] = x; 
			});
			$scope.toggleComments = function(post) {
				post.showComments = !post.showComments;
				if(post.showComments) {
					postFactory.getComments(post, function(comments) {
						comments = JsonToArray(comments).sort((a, b) => {
							if(a.date > b.date) {
								return 1;
							} else {
								return -1;
							}
						});
						post.comments = comments;
					});
				}
			};
			$scope.addLike = function(post) {
				if(post.canLike) {
					postFactory.like($rootScope.me.email, post.id, function() {
						post.likes ++;
					});
				}
				else if($rootScope.me !== undefined && post.id !== undefined) {
					postFactory.like($rootScope.me.email, post.id, function() {
						post.likes --;
					});
				}
				post.canLike = !post.canLike;
			};
			$scope.addComment = function(post) {
				postFactory.comment(post, post.newMessage, function() {
					post.newMessage = "";
				});
			};
			$scope.displayUserInfo = function(comment) {
				comment.showProfile = !comment.showProfile;
			};
		/*
			$scope.bestPosts = function() {
				return $scope.posts.sort((a, b) => {
					if(a.likesCount < b.likesCount) {
						return 1;
					} else if(a.likesCount === b.likesCount){
						return 0;
					} else {
						return -1;
					}
				});
			};*/
			$scope.recentPosts = function() {
				return $scope.posts.sort((a, b) => {
					if(a.date > b.date) {
						return 1;
					} else if(a.likesCount === b.likesCount){
						return 0;
					} else {
						return -1;
					}
				});
			};
  		}

  		if($rootScope.me === undefined || $rootScope.me.connected === undefined) {
			$rootScope.me = profileProvider.getProfile(false, true).then(content);
		} else {
			content();
		}
 	});
