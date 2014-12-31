(function(){
    "use strict";

    /**
     * Purpose:
     *
     * Use GSAP `TimelineLite` to demonstrate use of animation timelines to build complex transitions.
     * Use GSAP-AngularJS Timeline DSL to parse and build timeline transitions
     *
     */
    angular.module("kodaline",['gsTimelines','ng'])
        .factory(   "tilesModel",     TileDataModel )
        .controller("KodaController", KodaController )

    /**
     * KodaController constructor
     * @constructor
     */
    function KodaController( $scope, tilesModel, $timeline, $timeout, $q, $log ) {

        $scope.preload     = makeLoaderFor("#details > img", true);
        $scope.showDetails = showDetails;
        $scope.hideDetails = angular.noop;

        enableAutoClose();
        preloadImages();
        autoZoom(0)


        // ************************************************************
        // Show Tile features
        // ************************************************************

        /**
         * Open Details view upon tile clicks
         * Run custom `Show Details` view transitions
         *
         * NOTE:
         *
         * This programatically uses the $timeline() locator to
         * find the timeline animation instance and manually runs
         * the `restart()` or `reverse()` processes.
         *
         */
        function showDetails(tileIndex) {
            var selectedTile = tilesModel[tileIndex],

                makeNotify = function(direction, action) {
                  action = action || "finished";
                  return function(tl) {
                      $log.debug( "tl('{0}') {1}...".supplant([direction, action]));
                  };
                },
                unZoom = function() {
                    // Reverse the `zoom` animation
                    $scope.$apply(function(){
                        $timeline("zoom").then(function(animation){
                           $scope.hideDetails = angular.noop;

                            animation.reverse();
                        });
                    });
                },
                doZoom = function() {
                    // Push `hideDetails` to $scope for use by autoClose()
                    // Trigger databindings in the `<gs-timeline />` markup to use the selected tile...

                    $scope.hideDetails = unZoom;
                    $scope.selectedTile = selectedTile;

                    // Lookup animation for `zoom` and register
                    // optional event callbacks for logging before starting...

                    $timeline( "zoom", {

                      onComplete        : makeNotify("zoom"),
                      onReverseComplete : makeNotify("unzoom"),
                      onUpdate          : makeNotify("zoom", "update")

                    }).then( function(animation){
                        animation.restart();
                    });
                };


            doZoom();
        }


        /**
         * Auto show zoom details for tile #1
         * @param tileIndex
         */
        function autoZoom(tileIndex) {
            $timeout(function(){
                showDetails(tileIndex, true);
            }, 30 );
        }

        // ************************************************************
        // Image Features
        // ************************************************************

        /**
         * Load all the full-size images in the background...
         */
        function preloadImages() {
            var preloads = tilesModel.slice(1);
            var loader   = makeLoaderFor("#backgroundLoader");
            try {

                // Sequentially load the tiles (not parallel)
                // NOTE: we are using a hidden `img src` to do the pre-loading

                return preloads.reduce(function(promise, tile ){
                    return promise.then(function(){
                        return loader(tile).then(function(){
                            return 0; // first tile index
                        });
                    });

                }, $q.when(true))

            } catch( e ) { ; }
        }

        /**
         * Preload background and foreground images before transition start
         * Only load() 1x using the `imageLoaded` flag
         */
        function makeLoaderFor(selector, includeContent) {

            // Use a promise to delay the start of the transition until the full album image has
            // loaded and the img `src` attribute has been updated...

            return function loadsImagesFor(tile) {
                tile = tile || tilesModel[0];

                var deferred = $q.defer();
                var element = $(selector);

                if ( !!includeContent ) {
                    $("#stage div#title > .content").css("background-image", "url(" + tile.titleSrc + ")");
                    $("#stage div#info  > .content").css("background-image", "url(" + tile.infoSrc + ")");
                }

                if ( tile.imageLoaded != true ) {
                    $log.debug( "loading $( {0} ).src = {1}".supplant([selector || "", tile.albumSrc]));

                    element.one( "load", function(){
                        $log.debug( " $('{0}').loaded() ".supplant([selector]) );

                        // Manually track load status
                        tile.imageLoaded = true;
                        deferred.resolve(tile);
                    })
                    .attr("src", tile.albumSrc);

                } else {
                    if (element.attr("src") != tile.albumSrc) {
                        $log.debug( "updating $({0}).src = '{1}'".supplant([selector || "", tile.albumSrc]));
                        element.attr("src", tile.albumSrc);
                    }
                    deferred.resolve(tile);
                }

                return deferred.promise;
            }
        }


        // ************************************************************
        // Other Features - autoClose and Scaling
        // ************************************************************

        /**
         * Add Escape key and mousedown listeners to autoclose/reverse the
         * zoom animations...
         */
        function enableAutoClose() {
            $('body').keydown( autoClose );
            $('#mask').mousedown( autoClose );
            $('#details').mousedown( autoClose );
        }

        /**
         * Auto-close details view upon ESCAPE keydowns
         */
        function autoClose(e) {
            if ((e.keyCode == 27) || (e.type == "mousedown")) {
                ($scope.hideDetails || angular.noop)();
                e.preventDefault();
            }
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

})();
