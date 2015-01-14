angular
  .module("app")
  .directive("purpleBlock", purpleBlock)
  .directive("orangeBlock", orangeBlock);

function purpleBlock($animate, $q) {
  return {
    restrict: "EA",
    link: link,
    scope: { status: "=" },
    template: '<div class="block purple"></div>'
  };
  
  function link(scope, element, attrs) {
    
    var block = element.find(".block");
    
    scope.lookup = "purpleLookup";
    
    scope.$on("reset-animations", function() {
      block.removeClass("move rotate fade scale");
      TweenMax.set(block, { autoAlpha: 1, scale: 1, rotation: 0, x: 0 });
    });
    
    scope.$on("start-animations", function() {
      
      $q.when(scope.status.running = true)
        .then(function() { return $animate.addClass(block, "move"); })
        .then(function() { return $animate.addClass(block, "rotate"); })
        .then(function() { return $animate.addClass(block, "scale"); })
        .then(function() { return $animate.addClass(block, "fade"); })
        .then(function() { return scope.status.running = false; });
    });
  }
}

function orangeBlock($animate, $q) {
  return {
    restrict: "EA",
    link: link,
    scope: {},
    template: '<div class="block orange"></div>'
  };
  
  function link(scope, element, attrs) {
    
    var block = element.find(".block");
    
    scope.lookup = "orangeLookup";
    
    scope.$on("reset-animations", function() {
      block.removeClass("move rotate fade scale");
      TweenMax.set(block, { autoAlpha: 1, scale: 1, rotation: 0, x: 0 });
    });
    
    scope.$on("start-animations", function() {
      
      $q.when()
        .then(function() {
          var move = $q.defer();
          $animate.addClass(block, "move").then(function() { move.resolve(); });
          return move.promise;
        })
        .then(function() {
          var rotate = $q.defer();
          $animate.addClass(block, "rotate").then(function() { rotate.resolve(); });
          return rotate.promise;
        })
        .then(function() {
          var scale = $q.defer();
          $animate.addClass(block, "scale").then(function() { scale.resolve(); });
          return scale.promise;
        })
        .then(function() {
          var fade = $q.defer();
          $animate.addClass(block, "fade").then(function() { fade.resolve(); });
          return fade.promise;
        });
    });
  }
}




