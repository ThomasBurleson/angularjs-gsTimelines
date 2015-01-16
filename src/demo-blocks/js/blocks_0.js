(function() {
  "use strict";

  angular
    .module("AnimationChainsApp", [ 'ng'  ])
    .service("$timeline",             TimelineService      )
    .controller("AnimationController", AnimationController );


  /**
   * MainController
   * @param $scope
   * @param $timeline
   * @constructor
   */
  function AnimationController($scope, $timeline, $timeout, $q) {

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
        var orange = $("div.block.orange");
        var purple = $("div.block.purple");

        $scope.progress = init();
        $scope.elapsedTime = "";

        $timeline.reset([orange, purple]);
    }

    /**
     * Start animation sequences
     */
    function startAnimation()  {
      var startedAt = Date.now();

      var orange = $("div.block.orange");
      var purple = $("div.block.purple");

      $scope.animating=true;
      $scope.reset();
      $timeline.reset([orange, purple]);

      // Animation with `purple` delayed 1sec
      $q.all([

        startChain(orange, "orange"),
        startChain(purple, "purple", 1000)

      ]).then( function(){

        // When all done...
        $scope.animating=false;
        $scope.elapsedTime = (Date.now() - startedAt);

      });

      /**
       * Use $timeline to start the sequence with specific callbacks
       * @returns {*} Promise to notify when finished
       */
      function startChain(target, name, delay) {
        var deferred = $q.defer();

          $timeout(function() {

            return $timeline.start( target,
              function( action ){ $scope.progress[name][action] = "running..."; },
              function( action ){
                $scope.progress[name][action] = "finished";

                if ( action == "fade" ) {
                  deferred.resolve( action );
                }
              }
            );

          },delay || 0, false);

        return deferred.promise;
      }
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


  }



  /**
   * TimelineService that publishes pre-defined TweenMax animation sequences
   * @returns {{start: startTimeline, reset: resetTimeline}}
   * @constructor
   */
  function TimelineService($q, $log, $rootScope) {
    var tweenSteps = [
      {
        name: "move",
        tween : function(element, start, done) {
          TweenMax.to(element, 1.0, { x: 400, repeat: 1, yoyo: true, onStart: start, onComplete: done });
        }
      },
      {
        name: "rotate",
        tween : function(element, start, done) {
          TweenMax.to(element, 1.0, { delay:0.03, rotation: 180, onStart: start, onComplete: done });
        }
      },
      {
        name: "scale",
        tween : function(element, start, done) {
          TweenMax.to(element, 1.0, { delay:0.03, scaleX: 2, x: 50, onStart: start, onComplete: done });
        }
      },
      {
        name: "fade",
        tween : function(element, start, done) {
          TweenMax.to(element, 1.0, { delay:0.03, autoAlpha: 0.2, scaleX: 1, scaleY: 0.5, onStart: start, onComplete: done });
        }
      }
    ];
    var tweenReset = function(element) {
      TweenMax.set(element, { autoAlpha: 1, scale: 1, rotation: 0, x: 0 });
    };

    // Publish API
    return {
      start : startTimeline,
      reset : resetTimeline
    };

    /**
     * Reset the target(s) for future animations...
     * @param target
     */
    function resetTimeline(target) {
      var targets = angular.isArray(target) ? target : [target];

      targets.forEach(function(it){
        tweenReset(it);
      });
    }

    /**
     * Start the timeline (sequence of tweens) on the target element
     * @returns {*} Promise
     */
    function startTimeline( target, start, done ) {
      var animationSteps = [].concat(tweenSteps);

      start = start || angular.noop;
      done  = done  || angular.noop;

      return createChain(target);

      // ********************************
      // Chain Steps
      // ********************************


      /**
       *  Create and auto-start a sequential promise
       *  chain of tweens
       */
      function createChain(target){

        // Create sequence of animations
        return animationSteps.reduce(function(promise, step){
          return promise.then(function(){
            return buildStep(step, target);
          });
        }, $q.when(true));

      }

      /**
       * Run the tween step with start & done callbacks
       */
      function buildStep(step, target) {
        var deferred = $q.defer();
        var startFn = function(start) {
          return function() {
            // use $apply() since animation callbacks are out-of-scope
            $rootScope.$apply(function(){

              $log.debug("TweenMax('{0}' on '{1}') started.".supplant([step.name, target.selector]));
              start(step.name);

            });
          };
        };
        var doneFn = function(done) {
          return function() {
            // use $apply() since animation callbacks are out-of-scope
            $rootScope.$apply(function(){

              $log.debug("TweenMax('{0}' on '{1}') finished.".supplant([step.name, target.selector]));
              done(step.name);

            });
            deferred.resolve(step.name);
          }
        };

        // Start the tweening with head-hooks to the callbacks...
        step.tween(target, startFn(start), doneFn(done) );

        return deferred.promise;
      }

    }
  }

})();

