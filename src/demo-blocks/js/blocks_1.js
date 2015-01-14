
angular
  .module("app", ["ngAnimate"])
  .controller("MainController", MainController)
  .directive("animationStatus", animationStatus);

function MainController($scope) {

  // View Model
  var vm = this;

  var orangeLookup = {};
  var purpleLookup = {};

  vm.status = {
    running: false
  };

  vm.orangeBlock = [
    { name: "move",   status: "--" },
    { name: "rotate", status: "--" },
    { name: "scale",  status: "--" },
    { name: "fade",   status: "--" }
  ];

  vm.purpleBlock = [
    { name: "move",   status: "--" },
    { name: "rotate", status: "--" },
    { name: "scale",  status: "--" },
    { name: "fade",   status: "--" }
  ];

  vm.animate = startAnimations;
  vm.reset   = reset;

  $scope.$on("animation-update", updateStatus);

  activate();
  /////////
  
  function activate() {
    
    // Creates a lookup object of the animation models above
    // so we won't have to search for a key in those arrays
    for (var i = 0; i < vm.orangeBlock.length; i++) {
      orangeLookup[vm.orangeBlock[i].name] = vm.orangeBlock[i];
      purpleLookup[vm.purpleBlock[i].name] = vm.purpleBlock[i];
    }
  }

  function updateStatus(event, data) {
    
    // Data here is passed from the animation module
    if (data.lookup === "orangeLookup") {
      orangeLookup[data.animation].status = data.status;
    } else {
      purpleLookup[data.animation].status = data.status;
    }
  }
  
  function updateAll(status) {
    
    // Resets the status property for the animations
    vm.orangeBlock.forEach(function(animation) {
      animation.status = status;
    });
    vm.purpleBlock.forEach(function(animation) {
      animation.status = status;
    });
  }
  
  function startAnimations() {
    reset();
    updateAll("Queued");
    
    // Broadcast sends events DOWN your scope
    $scope.$broadcast("start-animations");
  }

  function reset() {
    updateAll("--");
    $scope.$broadcast("reset-animations");
  }
}

// Simple directive to display the 
// animation models in a table
function animationStatus() {

  return {
    restrict: "EA",
    scope: { animations: "=" },
    template:
    '<table>' +
    '  <thead>' +
    '    <tr>' +
    '      <th>Animation</th>' +
    '      <th>Status</th>' +
    '    </tr>' +
    '  </thead>' +
    '  <tbody>' +
    '    <tr ng-repeat="animation in animations">' +
    '      <td>{{animation.name}}</td>' +
    '      <td>{{animation.status}}</td>' +
    '    </tr>' +
    '  </tbody>' +
    '</table>'
  };
}

