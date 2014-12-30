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
     * - Plugin use of Timeline Slider controls; independent of KodaController
     *   - Sync Slider to transition timeline
     *   - Use slider to manually sequence through transition frames
     * - Support to drag on image to manually sequence through transitions
     *
     *  //cdnjs.cloudflare.com/ajax/libs/gsap/1.14.2/TweenMax.min.js
     *  //cdnjs.cloudflare.com/ajax/libs/q.js/1.1.2/q.js
     *  //ajax.googleapis.com/ajax/libs/angularjs/1.3.5/angular.js
     *
     */
    angular.module("kodaline",['TimelineDSL','ng'])
        .factory( "tiles", TileDataModel )
        .controller("KodaController",       KodaController )

    /**
     * KodaController constructor
     * @constructor
     */
    function KodaController( $scope, $element, $timeout, $timelines, tiles) {

        $scope.showDetails = showDetails;
        $scope.hideDetails = angular.noop;


        scaleStage();
        $('body').keydown( autoClose );
        $('#mask').mousedown( autoClose );
        $('#details').mousedown( autoClose );

        showDetails(0);
        loadImages();

        /**
         * Open Details view upon tile clicks
         * Run custom `Show Details` view transitions
         *
         * NOTE: This programmatically finds the timeline animation
         * and runs `restart()` or `reverse()`
         *
         */
        function showDetails(tileIndex) {
            var source = tiles[tileIndex];
            var unZoom = function() {
                  $scope.$apply(function(){
                        $timelines
                            .id("zoom")
                            .then(function(timeline){
                                timeline.reverse();
                                $scope.hideDetails = angular.noop;
                            });
                    });
                },
                doZoom = function() {
                    // Update databindings in <timeline> markup
                    $scope.source = angular.extend({}, source);

                    // Find
                    $timelines
                      .id("zoom")
                      .then(function(timeline){
                          timeline.restart();
                      });
                };

            // Load images for the tile to be zoomed...

            loadTileImages(source).then(function()
            {
                $timeout(function(){
                    doZoom();
                    $scope.hideDetails = unZoom;
                },20);
            });
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
                // NOTE: we are using a hidden `img src` to do the pre-loading

                return tiles.reduce(function(promise, tile ){
                    return promise.then(function(){
                        return loadTileImages(tile ,"#backgroundLoader").then(function(){
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
        function loadTileImages(source, selector) {
            var deferred = Q.defer();
            // Update the background image for the `title` div

            if ( !selector ) {
                $("#stage div#title > .content").css("background-image", "url(" + source.titleSrc + ")");
                $("#stage div#info  > .content").css("background-image", "url(" + source.infoSrc + ")");
            }

            // Use a promise to start the transition ONCE the full album image has
            // already loaded and the img `src` attribute has been updated...

            selector = selector || "#details > img";

            if ( !source.imageLoaded ) {
                $(selector)
                    .load(function(){
                        // Manually track load status
                        source.imageLoaded = true;

                        $timeout(function(){
                            deferred.resolve(source.transitions);
                        },40,false);

                    })
                    .attr("src", source.albumSrc);
            } else {
                $(selector).attr("src", source.albumSrc);

                $timeout(function(){
                    deferred.resolve(source.transitions);
                },40,false);
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
            if ((e.keyCode == 27) || (e.type == "mousedown")) {
                ($scope.hideDetails || angular.noop)();
                e.preventDefault();
            }
        }


        /**
         * Startup viewport scaling for UX; this will increase
         * the stage size to fill the window area with
         * PROPORTIONAL_FIT_INSIDE
         */
        function scaleStage() {
            var win = {
                    width : $(window).width()-20,
                    height: $(window).height()-20
                },
                stage = {
                    width : 323,
                    height: 574
                },
                scaling = Math.min(
                    win.height/stage.height,
                    win.width/stage.width
                );

            // Scale and FadeIn entire stage for better UX

            new TimelineLite()
                .set('#stage', {scale:scaling, transformOrigin:"0 0 0" })
                .to("#stage", 0.5, {opacity:1});

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
            },
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
            }
        ];
    }

