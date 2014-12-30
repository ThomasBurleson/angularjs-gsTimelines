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
    angular.module("kodaline",['gsTimelines','ng'])
        .factory(   "tiles",          TileDataModel )
        .controller("KodaController", KodaController )

    /**
     * KodaController constructor
     * @constructor
     */
    function KodaController( $scope, $element, $timeout, $log, $timeline, tiles) {

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
            var selectedTile = tiles[tileIndex];
            var onComplete = function(direction, action) {
                  action = action || "finished";
                  return function(tl) {
                      $log.debug( "tl('{0}') {1}...".supplant([direction, action]));
                  };
                };
            var unZoom = function() {
                  $scope.$apply(function(){

                    // Reverse the `zoom` animation
                    $timeline("zoom").then(function(timeline){
                       $scope.hideDetails = angular.noop;

                       timeline.reverse();
                    });
                  });
                },
                doZoom = function() {
                    // Prepare event callbacks for logging...
                    var eventCallbacks = {
                            onComplete        : onComplete("zoom"),
                            onReverseComplete : onComplete("unzoom"),
                            onUpdate          : onComplete("zoom", "update")
                        };

                    // Update databindings in <timeline> markup
                    // to use the selected tile...

                    $scope.selectedTile = angular.extend({}, selectedTile);

                    // start the `zoom` animation

                    $timeline("zoom", eventCallbacks ).then(function(timeline){
                        timeline.restart();
                    });
                };

            // Load images for the tile to be zoomed...

            loadTileImages(selectedTile).then(function()
            {
                // Push to scope for use by autoClose()
                $scope.hideDetails = unZoom;

                doZoom();
            });
        }


        // ************************************************************
        // Image Features
        // ************************************************************

        /**
         * Load all the full-size images in the background...
         */
        function loadImages() {
            var preloads = tiles.slice(1);
            try {

                // Sequentially load the tiles (not parallel)
                // NOTE: we are using a hidden `img src` to do the pre-loading

                return preloads.reduce(function(promise, tile ){
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
        function loadTileImages(tile, selector) {
            var deferred = Q.defer();
            // Update the background image for the `title` div

            if ( !selector ) {
                $("#stage div#title > .content").css("background-image", "url(" + tile.titleSrc + ")");
                $("#stage div#info  > .content").css("background-image", "url(" + tile.infoSrc + ")");
            }

            // Use a promise to start the transition ONCE the full album image has
            // already loaded and the img `src` attribute has been updated...

            selector = selector || "#details > img";

            $log.debug( "loadTileImages( {0} ).src = {1}".supplant([selector || "", tile.albumSrc]));
            $log.debug( "preloaded == " + tile.imageLoaded);

            if ( !tile.imageLoaded ) {

                $(selector).one( "load", function(){
                    $log.debug( " $('{0}').loaded() ".supplant([selector]) );

                    // Manually track load status
                    tile.imageLoaded = true;

                    $timeout(function(){
                        deferred.resolve(tile);
                    }, 70);
                })
                .attr("src", tile.albumSrc);

            } else {
                $(selector).attr("src", tile.albumSrc);

                $timeout(function(){
                    deferred.resolve(tile);
                }, 70);
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
     * 
     * CDN Prefix:     http://solutionoptimist-bucket.s3.amazonaws.com/kodaline
     * Local Prefix:   ./assets/images/koda
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
                thumbSrc: "./assets/images/koda/thumb_kodaline_v3.png",
                albumSrc: "./assets/images/koda/album_kodaline.png",
                titleSrc : "./assets/images/koda/title_kodaline.png",
                infoSrc : "./assets/images/koda/info_kodaline.png"
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
                thumbSrc: "./assets/images/koda/thumb_moby_v3.png",
                albumSrc : "./assets/images/koda/album_moby_v2.png",
                titleSrc : "./assets/images/koda/title_moby.png",
                infoSrc : "./assets/images/koda/info_moby.png"
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
                thumbSrc: "./assets/images/koda/thumb_supermodel.png",
                albumSrc: "./assets/images/koda/album_supermodel.png",
                titleSrc : "./assets/images/koda/title_supermodel.png",
                infoSrc : "./assets/images/koda/info_supermodel.png"

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
                thumbSrc: "./assets/images/koda/thumb_goulding.png",
                albumSrc: "./assets/images/koda/album_goulding.png",
                titleSrc : "./assets/images/koda/title_goulding.png",
                infoSrc : "./assets/images/koda/info_goulding.png"
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
                thumbSrc: "./assets/images/koda/thumb_kodaline_v3.png",
                albumSrc: "./assets/images/koda/album_kodaline.png",
                titleSrc : "./assets/images/koda/title_kodaline.png",
                infoSrc : "./assets/images/koda/info_kodaline.png"
            }
        ];
    }

