    angular.module('TimelineDSL', [ 'ng' ])
        .service(  '$timelines', TimelineBuilder )
        .directive('timeline',  TimelineDirective )
        .directive('step',      StepDirective );


    /**
     * Service to build a GSAP TimelineLite instance based on <timeline> and nested <step>
     * directive settings...
     */
    function TimelineBuilder($log, $rootScope, $q ) {
        var counter = 0,
            targets = { },
            cache   = { },
            self;

        // Publish API for `$timelines` service

        return self = {
            state      : findByState,
            id         : findById,
            register   : register,
            instanceOf : build
        };

        // ******************************************************************
        // Internal Methods
        // ******************************************************************

        /**
         * Provide a async lookup to return a timeline after
         * all $digest changes have completed.
         *
         * @param id
         * @returns {Deferred.promise|*}
         */
        function findById( id ) {
            var deferred = $q.defer();

                $rootScope.$evalAsync( function(){
                    var timeline = cache[id];

                    if ( timeline )  deferred.resolve(timeline);
                    else             deferred.reject( "Timeline( id == '{0}' ) was not found.".supplant([ id ]) );

                });

            return deferred.promise;
        }

        /**
         * Provide a async lookup to return a timeline after
         * all $digest changes have completed.
         *
         * @param state
         * @returns {Deferred.promise|*}
         */
        function findByState( state ) {
            var deferred = $q.defer();

                $rootScope.$evalAsync( function(){
                    var timeline;

                    cache.forEach(function(it) {
                        if ( angular.isDefined(it.$$state) ){
                            if ( it.$$state == state )
                            {
                                timeline = it;
                            }
                        }
                    });

                    if ( timeline )  deferred.resolve(timeline);
                    else             deferred.reject( "Timeline( state == '{0}' ) was not found.".supplant([ state ]) );

                });

            return deferred.promise;
        }

        /**
         * Register timeline for easy lookups later...
         */
        function register(timeline, id, state) {
            if ( timeline && id && id.length ) {

                cache[ id ] = timeline;

                if ( angular.isDefined(state) )
                {
                    timeline.$$state = state;
                }
            }
        }

        /**
         * Build a TimelineLite instance
         *
         * @param source TimelineController
         * @param flushTargets Boolean to rebuild the query selectors
         * @returns {*} GSAP TimelineLite instance
         */
        function build(source, flushTargets) {
            targets = flushTargets ? { } : targets;

            var timeline = source.timeline || new TimelineLite({paused: true, data: {id: source.id || counter++ }});
                timeline.clear(true).timeScale( source.timeScale );
                timeline.eventCallback("onUpdate", source.onUpdate || angular.noop, ["{self}"] );

            source.timeline = timeline;
            source.steps.forEach(function(step, index) {

                var element     = querySelector(step.target);
                var frameLabel  = keyValue(step, "markPosition");
                var position    = keyValue(step, "position", "");
                var styles      = toJSON(keyValue(step, "style"));
                var hasDuration = !!keyValue(step, "duration");
                var duration    = hasDuration ? keyValue(step, "duration") : 0;

                if ( frameLabel )   timeline.addLabel( frameLabel );
                if ( hasDuration )  timeline.to(element,  +duration, styles,  position );
                else                timeline.set(element, styles );

            });
            source.children.forEach(function(it){
                if ( it.timeline ) {
                    timeline.add(it.timeline, it.position);

                    // Unpause children timelines
                    it.timeline.paused(false);
                }
            });

            return logBuild(source);

            // ******************************************************************
            // Internal Debug Methods
            // ******************************************************************

            function logBuild( source ) {
                var timeline = source.timeline;

                $log.debug( "---------------------".supplant(timeline) );
                $log.debug( "rebuild timeline( {data.id} )".supplant(timeline) );
                $log.debug( "---------------------".supplant(timeline) );

                source.steps.forEach(function(step, index) {

                    var element     = querySelector(step.target);
                    var frameLabel  = keyValue(step, "markPosition");
                    var position    = keyValue(step, "position", "");
                    var styles      = toJSON(keyValue(step, "style"));
                    var hasDuration = !!keyValue(step, "duration");
                    var duration    = hasDuration ? keyValue(step, "duration") : 0;

                    if ( frameLabel )  $log.debug( "addLabel( '{0}' )"                    .supplant( [frameLabel] ));
                    if ( hasDuration ) $log.debug( "timeline.set( '{0}', {1},  {2}, '{3}' )" .supplant( [step.target, duration, JSON.stringify(styles), position ] ));
                    else               $log.debug( "timeline.set( '{0}', '{1}' )"            .supplant( [step.target, JSON.stringify(styles)] ));

                });

                source.children.forEach(function(it){
                    if ( it.timeline ) {

                    }
                });

                timeline.eventCallback("onUpdate", function onTimeLineUpdate(tl)
                {
                    $log.debug("timeline " + tl.data.id + " update()");

                }, ["{self}"]);

                return timeline;
            }

            // ******************************************************************
            // Internal Builder Methods
            // ******************************************************************

            /**
             * Find DOM element associated with query selector
             * Use the fallback timeline target if the step target `selector` is not
             * specified.
             *
             * @param selector
             * @returns {*}
             */
            function querySelector( selector ) {
                selector = selector || source.target;

                var element = targets[selector];
                if ( !element ) {

                    // Cache the jQuery querySelector for reuse
                    targets[selector] = element = $(selector);
                }

                return element;
            }
        }

        /**
         * Convert markup styles to JSON style map
         * @param keyValues
         */
        function toJSON(style) {
           var result = { };
           var pairs = style ? style.split(";") : [ ];

           pairs.forEach(function(it) {
              it = it.trim();
              if ( it.length ) {
                  it = it.split(":");
                  var key = it[0];
                  var value = it[1];

                  if ( String(value).length ) {
                    result[ stripQuotes(key) ] = stripQuotes(value);
                  }
              }
           });

           return result;
        }

        /**
         * Check map for valid string value...
         * @returns {*} String || defVal
         */
        function keyValue(map, key, defVal) {
            return angular.isDefined(map[key]) && (map[key].length > 0) ? map[key] : defVal;
        }

        /**
         * Strip any "" or '' quotes
         * @returns {String}
         */
        function stripQuotes(source) {
            return source.replace(/\"/g,"").replace(/\'/g,"");
        }
    }


    /**
     * Timeline Controller
     * Each controller manages its own timeline with its nested child steps.
     * However, a Timeline controller may be a child of a parent Timeline controller.
     *
     * @param $scope
     * @constructor
     */
    function TimeLineController($scope, $element, $q, $timelines) {
        var self         = this,
            timeline     = null,
            children     = [ ],
            steps        = [ ],
            pendingRebuild = null,
            bouncedRebuild = null,
            parentCntrl    = $element.parent().controller('timeline');

        self.addStep  = onStepChanged;  // Publish method for StepDirective
        self.addChild = onAddTimeline;  // Publish method for TimelineDirective

        // Publish accessors for $timelines::buildTimeline()

        // ******************************************************************
        // Internal Builder Methods
        // ******************************************************************

        /**
         * Create a `debounced` async timeline build process; this allows
         * all step changes and child timeline additions to complete before
         * rebuilding.
         */
        function asyncRebuild() {

            bouncedRebuild = bouncedRebuild || debounce(rebuildTimeline, 10);
            pendingRebuild = pendingRebuild || $q.defer();

            // Keep debouncing...

            bouncedRebuild();

            /**
             * Rebuild the timeline when the steps or children timelines are changed...
             */
             function rebuildTimeline() {
                 if ( !pendingRebuild ) return;

                 try {
                     if ( children.length || steps.length ) {

                         // Build or update the TimelineLite instance
                         timeline = $timelines.instanceOf({
                             timeline : timeline,
                             steps    : steps,
                             children : children,
                             target   : $scope.target,
                             timeScale: +$scope.timeScale || 1.0
                         });

                         // Register for easy lookups later...
                         $timelines.register( timeline, $scope.id, $scope.state );
                     }

                     // Add to parent as child timeline (if parent exists)
                     parentCntrl && parentCntrl.addChild( timeline, +$scope.position  || 0.0 );

                     // Now resolve any pending requests with the up-to-date `timeline`
                     pendingRebuild.resolve( timeline );

                 } finally {
                     pendingRebuild = null;
                 }
             }
        }

        /**
         * Add a child timeline instance to this timeline parent
         *
         * @param timeline Child TimelineLite instance
         * @param position start offset in the parent timeline
         */
        function onAddTimeline(timeline, position) {
            try {
                // If not already registered...
                if ( children.indexOf(timeline) < 0 ) {
                    children.push({
                        timeline : timeline,
                        position : +position
                    });
                }
            } finally {

                // Perform an async rebuild of the timeline; async to
                // respond to all changes as a single batch response.

                asyncRebuild();
            }
        }

        /**
         * When properties of a child step changes,
         * we need to rebuild the timeline...
         * @param step
         */
        function onStepChanged(step) {

            try{

                if ( steps.indexOf(step) < 0 ) {
                    // If not already registered...
                    steps.push(step);
                }

            } finally {

                // Perform an async rebuild of the timeline; async to
                // respond to all changes as a single batch response.

                asyncRebuild();
            }
        }


        /**
         * Returns a function, that, as long as it continues to be invoked, will not
         * be triggered. The function will be called after it stops being called for
         * <wait> milliseconds.
         *
         * @param func
         * @param wait
         * @param scope
         * @returns {Function}
         */
        function debounce(func, wait, scope) {
          var timeout;

          return function debounced() {
            var context = scope || this, args = arguments;

            clearTimeout(timeout);

            timeout = setTimeout(function() {
              timeout = null;
              func.apply(context, args);
            }, wait);

          };
        }
    }


    /**
    * @ngdoc directive
    * @returns {{restrict: string, controller: string, link: Function}}
    * @constructor
    */
   function TimelineDirective($timeout, $timelines) {
       var counter = 1;

       return {
           restrict: "E",
           scope : {
               resolve : "&?"
           },
           controller : TimeLineController,
           link : function (scope, element, attr, controller)
           {
               var parentCntl = element.parent().controller('timeline');

               // Manually access these static properties

               scope.id        = attr.id        || ("timeline_" + counter++);
               scope.position  = attr.position  || 0;
               scope.timeScale = attr.timeScale || 1.0;
               scope.state     = attr.state;
               scope.target    = attr.target;

               // Build watchers to trigger animations or nest timelines...

               if ( !parentCntl ) autoStart();


               // ******************************************************************
               // Internal Methods
               // ******************************************************************

               /**
                *  Watch the `state` variable and autostart the Timeline instance when state
                *  changes
                */
               function autoStart() {
                 var state  = attr.state || "";
                 if ( state.length ) {
                     // Watch for the scope `state` change... to start or reverse the animations

                     parent = scope.$parent;
                     parent.state = parent.state || undefined;

                     parent.$watch('state', function(current, old){
                         if ( current === undefined ) return;
                         if ( state   === ""        ) return;

                         $timelines
                            .find(scope.id)
                            .then(function( timeline ){

                                if ( current == state ) timeline.restart();
                                else if (current == "") timeline.reverse();

                            });

                     });
                 }
               }
           }
       };
   }

    /**
     * @ngdoc directive
     *
     * Steps can only be defined as children of a Timeline. Steps are used to label frames, set styles,
     * or animation 1..n sets of properties for a specific duration.
     *
     * @returns {{restrict: string, scope: {style: string, duration: string, position: string, markPosition: string, clazz: string}, require: string[], link: LinkStepDirective}}
     * @constructor
     *
     * @example:
     *
     *      <step   class=""
     *              duration="0.3"
     *              position="0.1"
     *              style="opacity:1; left:{{source.left}}; top:{{source.top}}; width:{{source.width}}; height:{{source.height}};" >
     *      </step>
     */
    function StepDirective() {
        return {
            restrict : "E",
            scope : {
                className    : "@?",
                duration     : "@?",
                markPosition : "@?",
                position     : "@?",
                style        : "@"
            },
            require : "^timeline",
            link : function LinkStepDirective(scope, element, attr, ctrl) {

                scope.target = attr.target;
                scope.$watch('style', function onChangeStep() {
                    ctrl.addStep(scope);
                });

            }
        };
    }


