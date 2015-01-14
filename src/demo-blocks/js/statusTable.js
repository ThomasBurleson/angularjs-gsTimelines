(function(app) {
  "use strict";

  angular
    .module( app )
    .directive("statusTable", StatusTableDirective );


  /**
   * StatusTableDirective Directive
   * Simple directive to display the animation chain progress in a table
   *
   * @returns {{restrict: string, scope: {progress: string}, template: string, link: Function}}
   * @constructor
   */
  function StatusTableDirective() {

    return {
      restrict: "EA",
      scope: { progress: "=" },
      template:
      '<table>' +
      '  <thead>' +
      '    <tr>' +
      '      <th>Animation</th>' +
      '      <th>Status</th>' +
      '    </tr>' +
      '  </thead>' +
      '  <tbody>' +
      '    <tr ng-repeat="step in steps">' +
      '      <td>{{step.name}}</td>' +
      '      <td>{{step.status}}</td>' +
      '    </tr>' +
      '  </tbody>' +
      '</table>',

      link : function (scope )
      {
        scope.steps = buildSteps(scope.progress);
        scope.$watch( getProgressHash, updateProgress );

        // ****************************
        // Internal postLink methods
        // ****************************

        /**
         * Translate progress to view model
         */
        function buildSteps(progress){
          var steps = [ ];
          angular.forEach(progress, function(value, key) {
            steps.push({name:key, status:value})
          });

          return steps;
        }

        /**
         * Build encoded hash value of entire progress
         */
        function getProgressHash() {
          var hash = "";
          angular.forEach(scope.progress,function(value, key){
            hash = hash + value;
          });
          return hash;
        }

        /**
         * Scan progress and copy status values to view model
         */
        function updateProgress(current, previous) {
          if ( !current ) return;
          if ( current == previous ) return;

          var steps = scope.steps;

          // Copy the progress status over to the view model
          angular.forEach(scope.progress, function(value, name) {
            for (var j=0; j<steps.length;j++) {
              if ( steps[j].name == name ) {
                steps[j].status = value;
              }
            }
          });
        }
      }
    };
  }

})("AnimationChainsApp");

