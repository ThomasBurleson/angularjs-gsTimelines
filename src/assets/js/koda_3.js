(function(){
    /**
     * Purpose:
     *
     * Use GSAP `TimelineLite` to demonstrate use of animation timelines to build complex transitions.
     * Explore the API usages & complexities of functionality required to create the desired effects and UX.
     *
     * Some other considerations:
     *
     * - Load images in background so zoom works quickly
     * - Use promises to delay transitions until the images are ready
     * - Dynamically modify timescale so unzoom is faster
     * - Use of global keypress to unzoom/reverse the timeline
     * - Use tile data model to define dynamic zoom from/to information
     * - Plugin use of Timeline Slider controls; independent of TimelineController
     *   - Sync Slider to transition timeline
     *   - Use slider to manually sequence through transition frames
     * - Support to drag on image to manually sequence through transitions
     *
     */
    angular.module("kodaline",['ng'])
           .factory( "tiles", TileDataModel )
           .controller("TimelineController",       TimelineController )
           .controller("TimelineSliderController", TimelineSliderController );

    /**
     * TimelineController constructor
     * @constructor
     */
    function TimelineController( $scope, tiles, $q ) {
        var hideDetails;

        $scope.timeline = null;
        $scope.showDetails = showDetails;


        scaleStage();
        $('body').keydown( autoClose );

        loadImages()
            .then( getTransitions )
            .then( function(transitions){
                // set default or initial timeline
                timeline(transitions.enter);
            });

        // **************************************************
        // Build Animation Timelines
        // **************************************************

        /**
         * Getter/Setter for currentl Timeline instance
         * which is published on the scope for access by
         * the child TimelineSliderController
         *
         * @param tl
         */
        function timeline(tl) {
            if (tl === undefined ) {
                return $scope.timeline;
            }
            else if(!$scope.$$phase) {
                $scope.$apply(function(){
                    $scope.timeline = tl;
                });
            } else {
                $scope.timeline = tl;
            }
        }
        /**
         * Open Details view upon tile clicks
         * Run custom `Show Details` view transitions
         *
         */
        function showDetails(tileIndex) {
            loadTileImages(tiles[tileIndex]).then(function()
            {
                getTransitions(tileIndex).then( function(transitions)
                {
                    var details = document.getElementById("details");

                    // Only use the `zoom` transition for now...

                    timeline(transitions.enter);

                    details.onclick = hideDetails = function() {
                        timeline().timeScale(1.4).reverse();
                    };

                    timeline().timeScale(1.0).restart();
                });
            });
        }


        /**
         * Get a promise for the enter & leave transitions...
         * which will be resolved when the transitions are ready!
         *
         * @param tile
         * @returns {*}
         */
        function getTransitions(index) {

            var options = tiles[ index || 0 ];
            if ( !options.transitions ) {
                // If not cached, build it.
                options.transitions = buildTransitions(options);
            }

            return $q.when(options.transitions);
        }


        /**
         * Build the enter and leave transitions for the details
         *
         * @param start
         * @param fullWidth
         * @returns {{enter: TimelineLite, leave: TimelineLite}}
         */
        function buildTransitions(options) {
            var mask = document.getElementById("mask"),
                details = document.getElementById("details"),
                green = document.getElementById("green_status"),
                pause = document.getElementById("pause"),
                title = document.getElementById("title"),
                info = document.getElementById("info"),
                title_cnt = title.children[0],
                info_cnt  = info.children[0];

            var zoom = new TimelineLite({paused:true,   data:{id:'zoom'} }),
                unzoom = new TimelineLite({paused:true, data:{id:'unzoom'} });

            var from = options.from,
                to   = options.to;

            // Do zoom to show Kodaline details...

            zoom.timeScale(1)
                .set(mask,             { zIndex:90, className:""})
                .set(details,          options.from )
                .to( details,  0.2,    { className:"", opacity:1} )
                .to( details,  0.3,    { left:0, height:to.height, width:323 } )
                .addLabel("fullWdith")
                .to( mask,        0.5, { opacity:0.80 },        "fullWidth-=0.3" )
                .to( details,     0.3, { top:18, height:512 },  "fullWidth-=0.05" )
                .addLabel("slideIn")
                .set(green,            { zIndex:92, opacity:1.0, top:21, className:"" })
                .to( green,       0.2, { top:0 },                "slideIn" )
                .to( title,       0.6, { height:131 },           "fullWidth")
                .to( info,        0.5, { height:56 },            "fullWidth+=0.2")
                .to( title_cnt,   0.8, { opacity:1 },            "fullWidth+=0.3")
                .to( pause,       0.4, { opacity:1, scale:1.0 }, "fullWidth+=0.4")
                .to( info_cnt,    0.4, { opacity:1 },            "fullWidth+=0.6");


            return { enter : zoom, leave : unzoom };
        }

        // ************************************************************
        // Image Features
        // ************************************************************

        /**
         * Load all the full-size images in the background...
         */
        function loadImages() {
            try {

                // Sequentially load the tiles (not parallel)
                // NOTE: we are using the same `img src` to do the loading

                return tiles.reduce(function(promise, tile ){
                    return promise.then(function(){
                        return loadTileImages(tile).then(function(){
                            return 0; // first tile index
                        });
                    });

                }, Q.when(true))

            } catch( e ) { ; }
        }

        /**
         * Preload background and foreground images before transition start
         * Only load() 1x using the `imageLoaded` flag
         */
        function loadTileImages(source) {

            var deferred = Q.defer();
            // Update the background image for the `title` div

            $("#stage div#title > .content").css("background-image", "url(" + source.titleSrc + ")");
            $("#stage div#info  > .content").css("background-image", "url(" + source.infoSrc + ")");

            // Use a promise to start the transition ONCE the full album image has
            // already loaded and the img `src` attribute has been updated...

            if ( !source.imageLoaded ) {
                $("#details > img")
                    .load(function(){
                        // Manually track load status
                        source.imageLoaded = true;
                        deferred.resolve(source.transitions);
                    })
                    .attr("src", source.albumSrc);
            } else {
                $("#details > img").attr("src", source.albumSrc);
                deferred.resolve(source.transitions);
            }

            return deferred.promise;
        }

        // ************************************************************
        // Other Features - autoClose and Scaling
        // ************************************************************


        /**
         * Auto-close details view upon ESCAPE keydowns
         */
        function autoClose(e) {
            if (e.keyCode == 27) {
                (hideDetails || angular.noop)();
                e.preventDefault();
            }
        }


        /**
         * Startup viewport scaling for UX; this will increase
         * the stage size to fill the window area with
         * PROPORTIONAL_FIT_INSIDE
         */
        function scaleStage() {
            var showSlider = !isMobile();
            var win = {
                    width : $(window).width()-20,
                    height: $(window).height()-(showSlider ? 160 : 20)
                },
                stage = {
                    width : 323,
                    height: 574
                },
                scaling = Math.min(
                    win.height/stage.height,
                    win.width/stage.width
                );

            if ( showSlider ) $("#timeline-slider").removeClass("hidden");

            // Scale and FadeIn entire stage for better UX

            new TimelineLite()
                .set('#stage', {scale:scaling, transformOrigin:"0 0 0" })
                .to("#stage", 0.5, {opacity:1});

            /**
             * Check if we are rendering on a mobile device... Needed so we do not show
             * the `timeline slider` control
             */
            function isMobile() {
                return navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod}/i);
            }
        }

    }

    /**
     * TimelineSliderController constructor
     * @constructor
     */
    function TimelineSliderController($scope) {
        var manualDrag = false,
            slider = {
                position      : 0.0,
                totalDuration : 0.0,
                step          : 0.05
            },
            currentTimeline = function() { return $scope.timeline; },
            currentPosition = function() { return slider.position; },
            /**
             *  Make sure that the specified timeline always provides
             *  progress updates... so we can sync the slider controls.
             */
            changeUpdateListeners = function(current, previous) {

                // Remove listener from previous timeline
                // Add onUpdate listener to current timeline (to track progress)

                if ( previous ) previous.eventCallback("onUpdate", null);
                if ( current )  current.eventCallback("onUpdate", onTimeLineUpdate, ["{self}"]);

                sliderMax( current ? current.totalDuration() : 0);
            },
            /**
             * Update timeline position to match with current slider thumb position
             * @param position
             */
            changeTimelinePosition = function(position) {
                if ( manualDrag && $scope.timeline ) {
                    $scope.timeline.time( position, true );
                }
            };


        $scope.slider = slider;
        $scope.isDragging = function(active) {
            manualDrag = active;
            if ( active == true ) {
                $scope.timeline.pause();
            }
        };

        $scope.$watch( currentTimeline, changeUpdateListeners  );
        $scope.$watch( currentPosition, changeTimelinePosition );


        // **************************************************
        // Timeline Slider Methods and Data Binding Features
        // **************************************************

        /**
         * Update Slider thumb position to match with current Timeline position
         * @param timeline
         */
        function onTimeLineUpdate(timeline) {
            if ( manualDrag ) return;

            var position = timeline.totalTime();

            if (timeline.data.id == "unzoom") {
                // Since the unzoom is NOT a zoom.reverse()
                // We simulate the progress position decreasing...
                position = $scope.slider.totalDuration - position;
            }

            sliderPosition( position );
        }

        /**
         * Getter/Setter for the slider max range value
         */
        function sliderMax(value) {
            if ( value === undefined ) {
                return $scope.slider.totalDuration;
            }
            else if(!$scope.$$phase) {
                $scope.$apply(function(){
                    $scope.slider.totalDuration = value;
                });
            } else {
                $scope.slider.totalDuration = value;
            }
        }

        /**
         * Getter/Setter for the slider thumb position
         * @param value
         * @returns {number}
         */
        function sliderPosition(value) {
            if ( value === undefined ) {
                return $scope.slider.position;
            }
            else  if(!$scope.$$phase) {
                $scope.$apply(function(){
                    $scope.slider.position = value;
                });
            } else {
                $scope.slider.position = value;
            }
        }
    }

    /**
     * Tile DataModel factory for model data used in Tile animations
     * @constructor
     */
    function TileDataModel() {
        return [
            {
                from: {
                    left:0,
                    top: 74,
                    width: 162,
                    height: 164
                },
                to : {
                    height : 210
                },
                thumbSrc: "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/thumb_kodaline_v3.png",
                albumSrc: "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/album_kodaline.png",
                titleSrc : "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/title_kodaline.png",
                infoSrc : "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/info_kodaline.png"
            },
            {
                from: {
                    left:163,
                    top: 74,
                    width: 161,
                    height: 164
                },
                to : {
                    height : 210
                },
                thumbSrc: "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/thumb_moby_v3.png",
                albumSrc : "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/album_moby_v2.png",
                titleSrc : "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/title_moby.png",
                infoSrc : "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/info_moby.png"
            },
            {
                from: {
                    left:0,
                    top: 239,
                    width: 161,
                    height: 223
                },
                to : {
                    height : 223
                },
                thumbSrc: "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/thumb_supermodel.png",
                albumSrc: "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/album_supermodel.png",
                titleSrc : "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/title_supermodel.png",
                infoSrc : "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/info_supermodel.png"

            },
            {
                from: {
                    left: 163,
                    top: 239,
                    width: 161,
                    height: 223
                },
                to : {
                    height : 223
                },
                thumbSrc: "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/thumb_goulding.png",
                albumSrc: "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/album_goulding.png",
                titleSrc : "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/title_goulding.png",
                infoSrc : "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/info_goulding.png"
            }
        ];
    }


    // **************************************************
    // Timeline Drag Features
    // **************************************************


    function attachDragBehavior(scope, element, bubbles) {
        // The state of the current drag & previous drag
        var drag;
        var previousDrag;
        // Whether the pointer is currently down on this element.
        var pointerIsDown;
        var START_EVENTS = 'mousedown touchstart pointerdown';
        var MOVE_EVENTS = 'mousemove touchmove pointermove';
        var END_EVENTS = 'mouseup mouseleave touchend touchcancel pointerup pointercancel';

        // Listen to move and end events on document. End events especially could have bubbled up
        // from the child.
        element.on(START_EVENTS, startDrag);
        $document.on(MOVE_EVENTS, doDrag)
                 .on(END_EVENTS, endDrag);

        scope.$on('$destroy', cleanup);

        return cleanup;

        /**
         *
         */
        function cleanup() {
            if (cleanup.called) return;
            cleanup.called = true;

            drag = pointerIsDown = false;

            element.off(START_EVENTS, startDrag);
            $document.off(MOVE_EVENTS, doDrag)
                .off(END_EVENTS, endDrag);
        }

        /**
         *
         * @param ev
         */
        function startDrag(ev) {
            var eventType = ev.type.charAt(0);
            var now = Util.now();

            // iOS & old android bug: after a touch event, iOS sends a click event 350 ms later.
            // Don't allow a drag of a different pointerType than the previous drag if it has been
            // less than 400ms.

            if (previousDrag && previousDrag.pointerType !== eventType &&
                (now - previousDrag.endTime < 400)) {
                return;
            }
            if ( !pointerIsDown ) {

                pointerIsDown = true;

                drag = {
                    // Restrict this drag to whatever started it: if a mousedown started the drag,
                    // don't let anything but mouse events continue it.
                    pointerType: eventType,
                    startX: getPosition(ev),
                    startTime: now
                };

                element
                    .one('$md.dragstart', function(ev) {
                        // Allow user to cancel by preventing default
                        if (ev.defaultPrevented) drag = null;
                    })
                    .triggerHandler('$md.dragstart', drag);
            }
        }

        /**
         *
         * @param ev
         */
        function doDrag(ev) {
            if (!drag || !isProperEventType(ev, drag)) return;

            if (drag.pointerType === 't' || drag.pointerType === 'p') {
                // No scrolling for touch/pointer events
                ev.preventDefault();
            }
            updateDragState(ev);
            element.triggerHandler('$md.drag', drag);
        }

        /**
         *
         * @param ev
         */
        function endDrag(ev) {
            pointerIsDown = false;
            if (!drag || !isProperEventType(ev, drag)) return;

            drag.endTime = Util.now();
            updateDragState(ev);

            element.triggerHandler('$md.dragend', drag);

            previousDrag = drag;
            drag = null;
        }

        /**
         *
         * @param ev
         */
        function updateDragState(ev) {
            var x = getPosition(ev);
            drag.distance = drag.startX - x;
            drag.direction = drag.distance > 0 ? 'left' : (drag.distance < 0 ? 'right' : '');
            drag.duration = drag.startTime - Util.now();
            drag.velocity = Math.abs(drag.duration) / drag.time;
        }

        /**
         *
         * @param ev
         * @returns {Number|pageX|*|_tempEvent.pageX|c.pageX}
         */
        function getPosition(ev) {
            ev = ev.originalEvent || ev; //support jQuery events
            var point = (ev.touches && ev.touches[0]) ||
                (ev.changedTouches && ev.changedTouches[0]) ||
                ev;
            return point.pageX;
        }

        /**
         *
         * @param ev
         * @param drag
         * @returns {*|boolean}
         */
        function isProperEventType(ev, drag) {
            return drag && ev && (ev.type || '').charAt(0) === drag.pointerType;
        }
    }

})();
