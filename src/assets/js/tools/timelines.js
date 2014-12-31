(function(){
    "use strict";

    /**
     * GSAP TimelineLite AngularJS module that supports
     * a custom DSL for animation definitions
     *
     * NOTE: Currently this module has some dependencies upon jQuery() features
     *       in querySelector()...
     *
     * @usage
     * <gs-timeline id="zoom" time-scale="1" resolve="preload(selectedTile)" >
     *    <gs-step target="#mask"      style="zIndex:-10;className:''"  duration="0.001" />
     *    <gs-step target="#details"   style="zIndex:-15;className:''"  duration="0.001" />
     *    <gs-step target="#mask"      style="zIndex:90" duration="0.001" />
     *    <gs-step target="#details"   style="zIndex:92; opacity:0.01; left:{{selectedTile.from.left}}; top:{{selectedTile.from.top}}; width:{{selectedTile.from.width}}; height:{{selectedTile.from.height}}"  duration="0.01"/>
     *    <gs-step target="#details"   style="opacity:1.0" duration="0.3" />
     *    <gs-step mark-position="fullThumb"/>
     *    <gs-step target="#details"   style="delay:0.2; left:0; height:{{selectedTile.to.height}}; width:329" duration="0.5"  />
     *    <gs-step mark-position="fullWidth"/>
     *    <gs-step target="#mask"      style="opacity:0.80"                   duration="0.5" position="fullWidth-=0.3"/>
     *    <gs-step target="#details"   style="opacity:1; top:18; height:512"  duration="0.3" position="fullWidth+=0.1"/>
     *    <gs-step mark-position="slideIn"/>
     *    <gs-step target="#details > #green"  style="zIndex:92; opacity:1; top:21; className:''" />
     *    <gs-step target="#details > #green"  style="top:0"       duration="0.2" position="slideIn"/>
     *    <gs-step target="#details > #title"  style="height:131"  duration="0.6" position="fullWidth" />
     *    <gs-step target="#details > #info"   style="height:56"   duration="0.5" position="fullWidth+=0.2" />
     *    <gs-step target="#details > #title > div.content" style="opacity:1.0" duration="0.8" position="fullWidth+=0.3" />
     *    <gs-step target="#details > #pause"               style="opacity:1; scale:1.0" duration="0.4" position="fullWidth+=0.4" />
     *    <gs-step target="#details > #info > div.content"  style="opacity:1"   duration="0.4" position="fullWidth+=0.6" />
     *  </gs-timeline>
     *
     */
    angular.module('gsTimelines', [ 'ng' ])
        .service(  '$timeline',   TimelineBuilder )
        .directive('gsTimeline',  TimelineDirective )
        .directive('gsStep',      StepDirective )
        .directive('gsScale',     ScaleDirective);


    /**
     * Service to build a GSAP TimelineLite instance based on <gs-timeline> and nested <gs-step>
     * directive settings...
     */
    function TimelineBuilder($log, $rootScope, $q) {
        var counter = 0,
            targets = { },
            cache   = { },
            self    = {
                state        : findByState,
                id           : findById,
                register     : register,
                makeTimeline : makeTimeline
            },

            // Add 1 or more event callbacks to the animation?
            // events : ["onComplete", "onReverseComplete", "onUpdate"]

            registerCallbacks = function(callbacks) {
                return function(tl) {
                    if ( callbacks) {
                        var events = getKeys(callbacks);

                        events.forEach(function(key){
                           tl.eventCallback(key, callbacks[key] || angular.noop, ["{self}"] );
                        });
                    }

                    // publish/provide the TimelineLite instance
                    return tl;
                }
            },

            // Chain step to resolve AFTER the timeline is ready
            // but BEFORE the timeline is delivered externally

            resolveBeforeReady = function(tl) {
                var callback = tl.$$resolveWith || angular.noop;

                return  $q.when( callback() ).then(function(){
                          return tl;
                        });
            },

            // Special lookup or accessor function

            $timeline = function ( id, callbacks ){

                // Is this an implicit lookup?

                if ( angular.isDefined(id) ){
                    return findById(id)
                               .then( registerCallbacks(callbacks) )
                               .then( resolveBeforeReady );
                }

                // Not a lookup, so return the API

                return self;
            };

            // Attach special direct search and make functions to the published
            // API for `$timeline` service

            angular.forEach(self,function(fn,key){
                $timeline[key] = fn;
            });


        // Publish the service with its API

        return $timeline;

        // ******************************************************************
        // Internal Methods
        // ******************************************************************

        /**
         * Make or update a TimelineLite instance
         *
         * @param source TimelineController
         * @param flushTargets Boolean to rebuild the query selectors
         * @returns {*} GSAP TimelineLite instance
         */
        function makeTimeline(source, flushTargets) {
            source  = source || { steps:[ ], children: [ ] };
            targets = flushTargets ? { } : targets;

            var querySelector = makeQuery( source,  targets );
            var timeline = source.timeline || new TimelineLite({paused: true, data: {id: source.id || counter++ }});
                timeline.clear(true).timeScale( source.timeScale || 1.0 );

            source.timeline = timeline;
            source.steps    = source.steps || [ ];
            source.children = source.children || [ ];

            source.steps.forEach(function(step, index) {

                var element     = querySelector( step.target );
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

            return logBuild(source, targets, $log);
        }

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
    }


    /**
     * Timeline Controller
     * Each controller manages its own timeline with its nested child steps.
     * However, a Timeline controller may be a child of a parent Timeline controller.
     *
     * @param $scope
     * @constructor
     */
    function TimeLineController($scope, $element, $q, $timeout, $timeline) {
        var self         = this,
            timeline     = null,
            children     = [ ],
            steps        = [ ],
            bouncedRebuild = null,
            debounce       = $debounce( $timeout ),
            parentCntrl    = $element.parent().controller('timeline');

        self.addStep     = onStepChanged;  // Used by StepDirective
        self.addChild    = onAddTimeline;  // Used by TimelineDirective
        self.addResolve  = onAddResolve;   // Used by TimelineDirective

        // Publish accessors for $timeline::makeTimeline()

        // ******************************************************************
        // Internal Builder Methods
        // ******************************************************************

        /**
         * Create a `debounced` async timeline build process; this allows
         * all step changes and child timeline additions to complete before
         * rebuilding.
         */
        function asyncRebuild() {
            bouncedRebuild = bouncedRebuild || debounce( rebuildTimeline );

            // Keep debouncing...
            bouncedRebuild();

            /**
             * Rebuild the timeline when the steps or children timelines are changed...
             */
             function rebuildTimeline() {

                 if ( children.length || steps.length ) {
                     // No rebuilding while active...
                     if ( timeline && timeline.isActive() ) {
                         timeline.kill();
                     }

                     // Build or update the TimelineLite instance
                     timeline = $timeline.makeTimeline({
                         timeline : timeline,
                         steps    : steps,
                         children : children,
                         target   : $scope.target,
                         timeScale: +$scope.timeScale || 1.0
                     });
                 }

                 // Register for easy lookups later...
                 $timeline.register( timeline, $scope.id, $scope.state );

                 // Add to parent as child timeline (if parent exists)
                 parentCntrl && parentCntrl.addChild( timeline, +$scope.position  || 0.0 );

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
         * Add hidden resolve callback to the timeline; which will be
         * resolved PRIOR to the resolve of the `$timeline( id )` promise.
         *
         * @param callback
         */
        function onAddResolve( callback ) {
            timeline = timeline || $timeline.makeTimeline();
            timeline.$$resolveWith = callback;
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

    }


    /**
    * @ngdoc directive
    * @returns {{restrict: string, controller: string, link: Function}}
    * @constructor
    */
   function TimelineDirective($parse, $timeline, $log) {
       var counter = 1;

       return {
           restrict: "E",
           scope : { },
           controller : TimeLineController,
           link : function (scope, element, attr, controller )
           {
               // Manually access these static properties

               scope.id        = attr.id        || ("timeline_" + counter++);
               scope.position  = attr.position  || 0;
               scope.timeScale = attr.timeScale || 1.0;
               scope.state     = attr.state;
               scope.target    = attr.target;

               // Build watchers to trigger animations or nest timelines...

               var parentCntl = element.parent().controller('timeline');
               if ( !parentCntl ) autoStart();

               prepareResolve();

               // ******************************************************************
               // Internal Methods
               // ******************************************************************

               /**
                * Prepare the `resolve` expression to be evaluated AFTER $digest() and BEFORE
                * the timeline instances are reconstructed...
                */
               function prepareResolve() {
                    if ( angular.isDefined(attr.resolve) )
                    {
                        var context  = scope.$parent;
                        var fn       = $parse(attr["resolve"], /* interceptorFn */ null, /* expensiveChecks */ true);

                        controller.addResolve( function(){
                            //$log.debug( "resolving( '{resolve}' )".supplant(attr) );
                            return fn(context);
                        });
                    }
               }

               /**
                *  Watch the `state` variable and autostart the Timeline instance when state
                *  changes
                */
               function autoStart() {
                 var state  = attr.state || "";
                 if ( state.length ) {
                     // Watch for the scope `state` change... to start or reverse the animations

                     var parent = scope.$parent;
                         parent.state = parent.state || undefined;

                     parent.$watch('state', function(current, old){
                         if ( current === undefined ) return;
                         if ( state   === ""        ) return;

                         $timeline(scope.id).then(function( timeline ){

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
     * or animate 1..n sets of properties for a specific duration.
     *
     * @returns {{restrict: string, scope: {style: string, duration: string, position: string, markPosition: string, clazz: string}, require: string[], link: LinkStepDirective}}
     * @constructor
     *
     * @example:
     *
     *      <gs-step  className=""
     *                duration="0.3"
     *                position="0.1"
     *                style="opacity:1; left:{{source.left}}; top:{{source.top}}; width:{{source.width}}; height:{{source.height}};" >
     *      </gs-step>
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
            require : "^gsTimeline",
            link : function LinkStepDirective(scope, element, attr, ctrl) {

                scope.target = attr.target;
                scope.$watch('style', function onChangeStep() {
                    ctrl.addStep(scope);
                });

            }
        };
    }


    /**
     * @ngdoc directive
     * Scale the attached element to the window inner bounds.
     *
     * Startup viewport scaling for UX; this will increase
     * the stage size to fill the window area with
     * PROPORTIONAL_FIT_INSIDE
     *
     */
    function ScaleDirective($window) {
        return {
            restrict : "A",
            link : function LinkStepDirective(scope, element, attr) {
                var win = {
                        width : $window.innerWidth-20,
                        height: $window.innerHeight-20
                    },
                    stage = {
                        width : 323,
                        height: 574
                    },
                    scaling = Math.min(
                        win.height/stage.height,
                        win.width/stage.width
                    ),
                    selector = '#' + attr.id;

                // Scale and FadeIn entire stage for better UX

                new TimelineLite()
                    .set(selector, {scale:scaling, transformOrigin:"0 0 0" })
                    .to(selector, 0.5, {opacity:1});

            }
        };
    }


    // ******************************************************************
    // Internal Debug Methods
    // ******************************************************************

    /**
     * Output the build steps and details to the console...
     *
     * @param source
     * @param targets
     * @param $log
     * @returns {*|TimelineLite}
     */
    function logBuild( source, targets, $log ) {
        var querySelector = makeQuery( source,  targets );
        var timeline = source.timeline;

        $log.debug( "---------------------" );
        $log.debug( "rebuild $timeline('{data.id}')".supplant(timeline) );
        $log.debug( "---------------------" );

        source.steps.forEach(function(step, index) {

            var element     = querySelector(step.target);
            var frameLabel  = keyValue(step, "markPosition");
            var position    = keyValue(step, "position", "");
            var styles      = toJSON(keyValue(step, "style"));
            var hasDuration = !!keyValue(step, "duration");
            var duration    = hasDuration ? keyValue(step, "duration") : 0;

            if ( frameLabel )       $log.debug( "addLabel( '{0}' )"                       .supplant( [frameLabel] ));
            else if ( hasDuration ) $log.debug( "timeline.set( '{0}', {1},  {2}, '{3}' )" .supplant( [step.target, duration, JSON.stringify(styles), position ] ));
            else                    $log.debug( "timeline.set( '{0}', '{1}' )"            .supplant( [step.target, JSON.stringify(styles)] ));

        });

        source.children.forEach(function(it){
            if ( it.timeline ) {
                $log.debug( "add child timeline( '{data.id}' )".supplant(it) );
            }
        });

        return timeline;
    }

    // ******************************************************************
    // Internal DOM Query Method
    // ******************************************************************

    /**
     * Find DOM element associated with query selector
     * Use the fallback timeline target if the step target `selector` is not
     * specified.
     *
     * @param selector
     * @returns {*}
     */
    function makeQuery( source, targets ){

        // Publish query method...
        return function querySelector( selector ) {
            selector = selector || source.target;

            var element = targets[selector];
            if ( !element ) {

                // Cache the querySelector DOM element for reuse
                targets[selector] = element = $(selector);
            }

            return element;
        }
    }

    // *****************************************************
    // Utility Methods
    // *****************************************************


    /**
     * Convert markup styles to JSON style map
     * @param keyValues
     */
    function toJSON(style) {
       var result = { };
       var pairs = !style ? [ ] : style.replace(/\s+/g,"").split(/;|,/g);

       pairs.forEach(function(it) {
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

    /**
     * Get array of object properties
     * @param source
     * @returns {keys}
     */
    function getKeys(source) {
        var results = [];
        for (var key in source ) {
            if ( source.hasOwnProperty(key) ) {
                results.push(key);
            }
        }
        return results;
    }

    /**
     * Returns a function, that, as long as it continues to be invoked, will not
     * be triggered. The function will be called after it stops being called for
     * <wait> milliseconds. The callback will be invoked and the $digest() process initiated.
     *
     * @param func
     * @param wait
     * @param scope
     * @returns {Function}
     *
     */
    function $debounce( $timeout ) {

        return function debounce(func, wait, scope) {
          var timer;

          return function debounced() {
            var context = scope,
                args = Array.prototype.slice.call(arguments);

            $timeout.cancel(timer);
            timer = $timeout(function() {

                timer = undefined;
                func.apply(context, args);

            }, wait || 10 );
          };
        }
    }


})();
