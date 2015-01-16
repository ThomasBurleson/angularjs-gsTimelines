(function() {
  "use strict";

  angular
    .module("AnimationChainsApp", [ 'ng', 'gsTimelines' ])
    .controller("AnimationController", AnimationController );


  /**
   * MainController
   * @param $scope
   * @param $timeline
   * @constructor
   */
  function AnimationController($scope, $timeline, $log) {
    var progress = {
      main   : {
        start : "--",
        done: "--"
      }
    };

    $scope.animating = false;
    $scope.progress  = angular.extend({}, progress);

    $scope.animate   = startAnimation;
    $scope.reset     = resetAnimations;

    // ****************************
    // Internal Methods
    // ****************************

    /**
     * Reset animations and enable buttons
     */
    function resetAnimations() {
      var gotoStart = function(animation){
            animation.progress(0).pause();
          };

        $scope.elapsedTime = "";
        $scope.progress = angular.extend({}, progress);

        $timeline("main").then( gotoStart );
    }

    /**
     * Start animation sequences
     */
    function startAnimation()  {

      $scope.reset();
      $scope.animating=true;

      $timeline( "main", callbacks() ).then( function(animation) {
        var message = "AnimationController::start( restarting '{data.id}' )";
        $log.debug(message.supplant(animation));

        animation.restart();
      });

    }


    /**
     * Create `onStart` and `onComplete` callbacks for
     * the gs-timeline instance.
     *
     * @param id String timeline ID
     * @returns {{onStart: Function, onComplete: Function}}
     */
    function callbacks() {
      var id = "main";
      var startedAt = Date.now();

      return {
        onStart    : function( ){
          $scope.$apply(function(){
            $log.debug("onStart( '{0}' )".supplant([id]) );
            $scope.progress[id]["start"] = "running...";
          });
        },
        onComplete : function( tl ){
          $log.debug("onComplete( '{0}' )".supplant([id]) );
          $scope.$apply(function(){
            $scope.progress[id]["done"] = "finished";

            $scope.animating=false;
            $scope.elapsedTime = (Date.now() - startedAt);
          });
        }
      }

    }
  }

})();

