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
  function AnimationController($scope, $timeline, $interval, $q) {
    var orange = $("div.block.orange");
    var purple = $("div.block.purple");

    $scope.animate   = startAnimation;

    // ****************************
    // Internal Methods
    // ****************************

    /**
     * Start animation sequences
     */
    function startAnimation()  {

      //var main = new TimelineMax({paused:true});
      //
      //    main.append(new TimelineMax({paused:true}).to( purple, 1.0, { x: 400, repeat: 1, yoyo: true }));
      //    main.append(
      //      new TimelineMax({paused:true})
      //            .to( purple, 1.0, { delay:0.03, rotation: 180 })
      //            .set( purple, { rotation:0} )
      //    );

      $scope.total = 0;
      $interval(function(){

        $scope.total += 300;

        if ( $scope.total >= 600 ) {
          //main.getChildren(true,false,true).forEach(function(tl){
          //   tl.paused(false);
          //});
          //main.restart();
          $timeline("purple").then(function())
        }

      },300,2);
    }
  }



})();

