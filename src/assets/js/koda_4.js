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
        .controller("KodaController", KodaController )
        .factory(   "tilesModel",     TileDataModel )

    /**
     * KodaController constructor
     * @constructor
     */
    function KodaController( $scope, tilesModel, $timeline, $timeout, $q, $log ) {

        $scope.allTiles    = [].concat(tilesModel);
        $scope.preload     = makeLoaderFor("#details > img", true);
        $scope.showDetails = showDetails;
        $scope.hideDetails = hideDetails;

        enableAutoClose();
        preloadImages();

        // Wait while image loads are started...

        $timeout(function(){
            // Auto zoom first tile
            showDetails(tilesModel[0], true);
        }, 100 );


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
        function showDetails(selectedTile, $event) {
            $timeline( "zoom", {
                onUpdate          : makeNotify("zoom", "updating..."),
                onComplete        : makeNotify("zoom", "complete.")
            });

            // Perform animation via state change
            $scope.state        = "zoom";
            $scope.selectedTile = updateBounds(selectedTile, $event);
        }

        /**
         *
         */
        function hideDetails() {
            $timeline( "zoom", {
                onUpdate          : makeNotify("zoom", "reversing..."),
                onReverseComplete : makeNotify("zoom", "reversed.")
            });

            $scope.state = '';
        }

        function makeNotify (direction, action) {
            return function(tl) {
                $log.debug( "tl('{0}') {1}".supplant([direction, action || "finished"]));
            };
        };

        // ************************************************************
        // Image Features
        // ************************************************************

        /**
         * Update the tile bounds data based on current tile settings.
         * The `tile.from` RECT is used by the animations...
         *
         * @param tile
         * @param $event
         * @returns {*}
         */
        function updateBounds(tile, $event) {
            if ( $event && $event.currentTarget ) {
                tile.from.left   = $event.currentTarget.offsetLeft + 1;
                tile.from.top    = $event.currentTarget.offsetTop + 1;
                tile.from.width  = $event.currentTarget.offsetWidth - 1;
                tile.from.height = $event.currentTarget.offsetHeight - 1;
            }
            return tile;
        }

        /**
         * Load all the full-size images in the background...
         */
        function preloadImages() {
            try {
                var loader   = makeLoaderFor("#backgroundLoader");

                // Sequentially load the tiles (not parallel)
                // NOTE: we are using a hidden `img src` to do the pre-loading

                return tilesModel.reduce(function(promise, tile ){
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
        var model = [
            {
                className : "tile1",
                from: {               },
                to  : { height : 216  },
                thumbSrc: "./assets/images/koda/thumb_kodaline_v3.png",
                albumSrc: "./assets/images/koda/album_kodaline.png",
                titleSrc : "./assets/images/koda/title_kodaline.png",
                infoSrc : "./assets/images/koda/info_kodaline.png"
            },
            {
                className : "tile2",
                from: {               },
                to  : { height : 216  },
                thumbSrc: "./assets/images/koda/thumb_moby_v3.png",
                albumSrc : "./assets/images/koda/album_moby_v2.png",
                titleSrc : "./assets/images/koda/title_moby.png",
                infoSrc : "./assets/images/koda/info_moby.png"
            },
            {
                className : "tile3",
                from: {               },
                to  : { height : 229  },
                thumbSrc: "./assets/images/koda/thumb_supermodel.png",
                albumSrc: "./assets/images/koda/album_supermodel.png",
                titleSrc : "./assets/images/koda/title_supermodel.png",
                infoSrc : "./assets/images/koda/info_supermodel.png"

            },
            {
                className : "tile4",
                from: {               },
                to  : { height : 229  },
                thumbSrc: "./assets/images/koda/thumb_goulding.png",
                albumSrc: "./assets/images/koda/album_goulding.png",
                titleSrc : "./assets/images/koda/title_goulding.png",
                infoSrc : "./assets/images/koda/info_goulding.png"
            },
            {
                from: {               },
                to  : { height : 216  },
                thumbSrc: "./assets/images/koda/thumb_kodaline_v3.png",
                albumSrc: "./assets/images/koda/album_kodaline.png",
                titleSrc : "./assets/images/koda/title_kodaline.png",
                infoSrc : "./assets/images/koda/info_kodaline.png"
            }
        ];

        return CDNify(model);

        /**
         * Replace localhost URLs with CDN URLs
         * @param items
         * @returns {*}
         * @constructor
         */
        function CDNify(items) {
            var prefixLocal = "./assets/images/koda/";
            var prefixCDN   = "http://solutionoptimist-bucket.s3.amazonaws.com/kodaline";

            items.forEach(function(it){

                it.thumbSrc.replace( prefixLocal, prefixCDN );
                it.albumSrc.replace( prefixLocal, prefixCDN );
                it.titleSrc.replace( prefixLocal, prefixCDN );
                it.infoSrc.replace( prefixLocal, prefixCDN );
            });

            return items;
        }
    }

})();
