angular
  .module("app")
  .animation(".block", blockAnimations);

function blockAnimations($timeout) {
  
  return {
    addClass: function(element, className, done) {
      
      var scope = element.scope();
      
      $timeout(function() {
        
        // Emit sends events UP your scope, timeout will update your scope
        scope.$emit("animation-update", { lookup: scope.lookup, animation: className, status: "Running" });
      });
      
      switch(className) {
        case "move"   : TweenMax.to(element, 1.0, { x: 400, repeat: 1, yoyo: true, onComplete: done }); break;
        case "rotate" : TweenMax.to(element, 1.0, { rotation: 180, onComplete: done }); break;
        case "scale"  : TweenMax.to(element, 1.0, { scaleX: 2, x: 50, onComplete: done }); break;
        case "fade"   : TweenMax.to(element, 1.0, { autoAlpha: 0, scaleX: 1, scaleY: 0.5, onComplete: done }); break;
        default: done();
      }
      
      return function() {
        
        // This gets called when an animation completes
        scope.$emit("animation-update", { lookup: scope.lookup, animation: className, status: "Finished" });
      };
    }
  };
}
