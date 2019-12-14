'use strict';

describe('Controller: PostcontrollerCtrl', function () {

  // load the controller's module
  beforeEach(module('angularApp'));

  var PostcontrollerCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    PostcontrollerCtrl = $controller('PostcontrollerCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(PostcontrollerCtrl.awesomeThings.length).toBe(3);
  });
});
