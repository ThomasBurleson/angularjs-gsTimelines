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
     *  //cdnjs.cloudflare.com/ajax/libs/gsap/1.14.2/TweenMax.min.js
     *  //cdnjs.cloudflare.com/ajax/libs/q.js/1.1.2/q.js
     *  //ajax.googleapis.com/ajax/libs/angularjs/1.3.5/angular.js
     *
     */
    angular.module("kodaline",['ng'])
        .factory( "tiles", TileDataService )
        .controller("TimelineController",       TimelineController );

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
        loadImages();

        // **************************************************
        // Build Animation Timelines
        // **************************************************

        /**
         * Open Details view upon tile clicks
         * Run custom `Show Details` view transitions
         *
         */
        function showDetails(tileIndex) {
            prepareTile( tiles[tileIndex] );
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
                        return prepareTile(tile).then(function(){
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
        function prepareTile(source) {

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
     * Tile DataModel factory for model data used in Tile animations
     * @constructor
     */
    function TileDataService() {
        return [
            {
                from: {
                    left:0,
                    top: 75,
                    width: 160,
                    height: 164
                },
                to : {
                    height : 216
                },
                thumbSrc: "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/thumb_kodaline_v3.png",
                albumSrc: "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/album_kodaline.png",
                titleSrc : "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/title_kodaline.png",
                infoSrc : "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/info_kodaline.png"
            },
            {
                from: {
                    left:165,
                    top: 75,
                    width: 160,
                    height: 166
                },
                to : {
                    height : 216
                },
                thumbSrc: "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/thumb_moby_v3.png",
                albumSrc : "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/album_moby_v2.png",
                titleSrc : "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/title_moby.png",
                infoSrc : "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/info_moby.png"
            },
            {
                from: {
                    left:0,
                    top: 240,
                    width: 159,
                    height: 221
                },
                to : {
                    height : 229
                },
                thumbSrc: "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/thumb_supermodel.png",
                albumSrc: "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/album_supermodel.png",
                titleSrc : "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/title_supermodel.png",
                infoSrc : "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/info_supermodel.png"

            },
            {
                from: {
                    left: 164,
                    top: 240,
                    width: 160,
                    height: 223
                },
                to : {
                    height : 229
                },
                thumbSrc: "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/thumb_goulding.png",
                albumSrc: "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/album_goulding.png",
                titleSrc : "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/title_goulding.png",
                infoSrc : "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/info_goulding.png"
            }
        ];
    }

})();
