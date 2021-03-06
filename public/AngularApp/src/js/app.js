//
// Here is how to define your module
// has dependent on mobile-angular-ui
//
var app = angular.module('AngularApp', ['ngRoute', 'mobile-angular-ui', 'nvd3ChartDirectives', 'mobile-angular-ui.gestures']);

//
// You can configure ngRoute as always, but to take advantage of SharedState
// location
// feature (i.e. close sidebar on backbutton) you should setup 'reloadOnSearch:
// false'
// in order to avoid unwanted routing.
//
app.config(function($routeProvider) {
	$routeProvider.when('/', {
		templateUrl : 'pages/home.html',
		controller : "homeController",
		reloadOnSearch : false
	});

	$routeProvider.when('/insertUser', {
		templateUrl : 'pages/insertUser.html',
		controller : 'insertUserController',
		reloadOnSearch : false
	});

	$routeProvider.when('/insertMachine', {
		templateUrl : 'pages/insertMachine.html',
		controller : 'insertMachineController',
		reloadOnSearch : false
	});
	$routeProvider.when('/graphs', {
		templateUrl : 'pages/graphs.html',
		controller : 'graphsController',
		reloadOnSearch : false
	});

});

//
// `$drag` example: drag to dismiss
//
app.factory('authInterceptor', function ($rootScope, $q, $window) {
  return {
    request: function (config) {
      config.headers = config.headers || {};
      if ($window.sessionStorage.token) {
        config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
      }
      return config;
    },
    response: function (response) {
      if (response.status === 401) {
        // handle the case where the user is not authenticated
      }
      return response || $q.when(response);
    }
  };
});

app.config(function ($httpProvider) {
  $httpProvider.interceptors.push('authInterceptor');
});

app.directive('dragToDismiss', function($drag, $parse, $timeout) {
	return {
		restrict : 'A',
		compile : function(elem, attrs) {
			var dismissFn = $parse(attrs.dragToDismiss);
			return function(scope, elem, attrs) {
				var dismiss = false;

				$drag.bind(elem, {
					constraint : {
						minX : 0,
						minY : 0,
						maxY : 0
					},
					move : function(c) {
						if (c.left >= c.width / 4) {
							dismiss = true;
							elem.addClass('dismiss');
						} else {
							dismiss = false;
							elem.removeClass('dismiss');
						}
					},
					cancel : function() {
						elem.removeClass('dismiss');
					},
					end : function(c, undo, reset) {
						if (dismiss) {
							elem.addClass('dismitted');
							$timeout(function() {
								scope.$apply(function() {
									dismissFn(scope);
								});
							}, 400);
						} else {
							reset();
						}
					}
				});
			};
		}
	};
});

//
// Another `$drag` usage example: this is how you could create
// a touch enabled "deck of cards" carousel. See `carousel.html` for markup.
//
app.directive('carousel', function() {
	return {
		restrict : 'C',
		scope : {},
		controller : function($scope) {
			this.itemCount = 0;
			this.activeItem = null;

			this.addItem = function() {
				var newId = this.itemCount++;
				this.activeItem = this.itemCount == 1 ? newId : this.activeItem;
				return newId;
			};

			this.next = function() {
				this.activeItem = this.activeItem || 0;
				this.activeItem = this.activeItem == this.itemCount - 1 ? 0 : this.activeItem + 1;
			};

			this.prev = function() {
				this.activeItem = this.activeItem || 0;
				this.activeItem = this.activeItem === 0 ? this.itemCount - 1 : this.activeItem - 1;
			};
		}
	};
});

app.directive('carouselItem', function($drag) {
	return {
		restrict : 'C',
		require : '^carousel',
		scope : {},
		transclude : true,
		template : '<div class="item"><div ng-transclude></div></div>',
		link : function(scope, elem, attrs, carousel) {
			scope.carousel = carousel;
			var id = carousel.addItem();

			var zIndex = function() {
				var res = 0;
				if (id == carousel.activeItem) {
					res = 2000;
				} else if (carousel.activeItem < id) {
					res = 2000 - (id - carousel.activeItem);
				} else {
					res = 2000 - (carousel.itemCount - 1 - carousel.activeItem + id);
				}
				return res;
			};

			scope.$watch(function() {
				return carousel.activeItem;
			}, function(n, o) {
				elem[0].style['z-index'] = zIndex();
			});

			$drag.bind(elem, {
				constraint : {
					minY : 0,
					maxY : 0
				},
				adaptTransform : function(t, dx, dy, x, y, x0, y0) {
					var maxAngle = 15;
					var velocity = 0.02;
					var r = t.getRotation();
					var newRot = r + Math.round(dx * velocity);
					newRot = Math.min(newRot, maxAngle);
					newRot = Math.max(newRot, -maxAngle);
					t.rotate(-r);
					t.rotate(newRot);
				},
				move : function(c) {
					if (c.left >= c.width / 4 || c.left <= -(c.width / 4)) {
						elem.addClass('dismiss');
					} else {
						elem.removeClass('dismiss');
					}
				},
				cancel : function() {
					elem.removeClass('dismiss');
				},
				end : function(c, undo, reset) {
					elem.removeClass('dismiss');
					if (c.left >= c.width / 4) {
						scope.$apply(function() {
							carousel.next();
						});
					} else if (c.left <= -(c.width / 4)) {
						scope.$apply(function() {
							carousel.next();
						});
					}
					reset();
				}
			});
		}
	};
});

//
// For this trivial demo we have just a unique MainController
// for everything
//
app.controller('MainController', function($rootScope, $scope, serviceHttp, $location, $route, $window) {
	$rootScope.signUpV = false;
	$rootScope.topButton= "Sign Up";
	$rootScope.topButtonClk = function(){
		$rootScope.signUpV = ! $rootScope.signUpV;
		console.log($rootScope.signUpV);
		if ($rootScope.signUpV == false){
			$rootScope.topButton= "Sign Up";
		} else {
			$rootScope.topButton= "Login";
		}
			
	}
	$rootScope.logOut = function(){
		delete $window.sessionStorage.token;
		$rootScope.Ui.turnOn('modal1');
	}
	
	// User agent displayed in home page
	$scope.userAgent = navigator.userAgent;

	// Needed for the loading screen
	$rootScope.$on('$routeChangeStart', function() {
		$rootScope.loading = true;
	});

	$rootScope.$on('$routeChangeSuccess', function() {
		$rootScope.loading = false;
	});

	// Fake text i used here and there.
	$scope.lorem = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Vel explicabo, aliquid eaque soluta nihil eligendi adipisci error, illum corrupti nam fuga omnis quod quaerat mollitia expedita impedit dolores ipsam. Obcaecati.';

	//
	// 'Scroll' screen
	//
	var scrollItems = [];

	for (var i = 1; i <= 100; i++) {
		scrollItems.push('Item ' + i);
	}

	$scope.scrollItems = scrollItems;

	$scope.bottomReached = function() {
		alert('Congrats you scrolled to the end of the list!');
	}
	//
	// Right Sidebar
	//
	$rootScope.notifications = [];
	$rootScope.refreshAlerts = function() {
		$rootScope.notifications = [];
		serviceHttp.get("/webService/alertsTST", function(json) {
			console.log(json);
			for (var i = 0; i < json.length; i++) {
				$rootScope.notifications.push({
					title : "Alert",
					description : json[i].message,
					user_id : json[i].user_id,
					id : json[i]._id,
					icon : "medium"
				})
			}

		})
	}
	$rootScope.refreshAlerts();

	$rootScope.getCount = function() {
		if ($rootScope.notifications.length > 0) {
			return true;
		} else {
			return false;
		}
	}
	$rootScope.goToDetail = function(user_id, id) {

		console.log(user_id, id);

		localStorage.setItem("userID", user_id);
		//localStorage.setItem("userName",name);
		//alert($location.$$path)
		if ($location.$$path == "/graphs") {
			$route.reload();
		}
		$location.path("/graphs");

	}

	$rootScope.clearAlert = function(id) {
		serviceHttp.deleteReq("/webService/alertsTST/" + id, function(json) {
			console.log("sters");
			$rootScope.refreshAlerts();
		})
	}

	$rootScope.clearAll = function() {
		serviceHttp.deleteCol("/webService/alertsTST", function(json) {
			console.log("sters");
			$rootScope.refreshAlerts();
		});

	}
	// $scope.notifications = [{
	// title : "Not using the machine",
	// description : "Alexander P. is not using the mach. for 5 days",
	// icon : "important"
	// }, {
	// title : "Not using correctly",
	// description : "Vasile A. has used the machine incorrectly on 15 Mar 2015",
	// icon : "medium"
	// }]

	//
	// 'Forms' screen
	//
	$scope.rememberMe = true;
	$scope.email = 'me@example.com';

	$scope.login = function() {
		alert('You submitted the login form');
	};

	//
	// 'Drag' screen
	//
	$scope.notices = [];

	for (var j = 0; j < 10; j++) {
		$scope.notices.push({
			icon : 'envelope',
			message : 'Notice ' + (j + 1)
		});
	}

	$scope.deleteNotice = function(notice) {
		var index = $scope.notices.indexOf(notice);
		if (index > -1) {
			$scope.notices.splice(index, 1);
		}
	};
});
