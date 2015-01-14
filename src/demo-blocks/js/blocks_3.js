(function() {
  "use strict";

  angular
    .module("AnimationChainsApp", ['gsTimelines','ng' ])
    .controller("AnimationController", AnimationController );


  /**
   * MainController
   * @param $scope
   * @param $timeline
   * @constructor
   */
  function AnimationController($scope, $timeline, $timeout, $q, $log) {

    $scope.animating = false;
    $scope.progress  = init();

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

        $scope.progress = init();
        $scope.elapsedTime = "";

        $timeline("purple").then( gotoStart );
        $timeline("orange").then( gotoStart );
    }

    /**
     * Start animation sequences
     */
    function startAnimation()  {
      var startedAt = Date.now();
      var onReady = function(animation){
            $log.debug("startAnimation( '{data.id}' )".supplant(animation) );
            animation.restart();
          };

      $scope.animating=true;
      $scope.reset();


      $q.all([

        startChain("orange", onReady, 0),
        startChain("purple", onReady, 1000)

      ]).then( function(animation){

        // When all done...
        $scope.animating=false;
        $scope.elapsedTime = (Date.now() - startedAt);

      });
    }

    /**
     * Macro to create a promise wrapper around process:
     * 1) Lookup timeline animation,
     * 2) register callbacks,
     * 3) call the readyFn to start the animations...
     * 4) return promise when the animation is done
     *
     * NOTE: Start can delayed by `delay` msecs
     *
     * @param name
     * @param readyFn
     * @param delay
     * @returns {*}
     */
    function startChain(name, readyFn, delay) {
      var deferred = $q.defer();
      var whenDone = function( tl ) { deferred.resolve( tl ); };

        $timeout(function() {

          return $timeline( name, makeCallbacks(name, whenDone) ).then( readyFn);

        }, delay||0, false);

      return deferred.promise;
    }



    /**
     * Initialize a `progress` structure
     * @returns {{purple: (void|Object|*), orange: (void|Object|*)}}
     */
    function init() {
      var steps = {move : "--", rotate: "--", scale: "--", fade: "--"};

      return {
        purple : angular.extend({},steps),
        orange : angular.extend({},steps)
      };
    }


    /**
     * Create `onStart` and `onComplete` callbacks for
     * each gs-timeline instance.
     *
     * @param id String timeline ID
     * @returns {{onStart: Function, onComplete: Function}}
     */
    function makeCallbacks(id, done) {
      done = done || angular.noop;

      return {
        onStart    : function( ){
          $scope.$apply(function(){
            $log.debug("onStart( '{0}' )".supplant([id]) );
            $scope.progress[id]["move"] = "running...";
          });
        },
        onComplete : function( tl ){
          $log.debug("onComplete( '{0}' )".supplant([id]) );
          $scope.$apply(function(){
            $scope.progress[id]["fade"] = "finished";
          });

          done( tl );
        }
      }

    }
  }

})();

