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
        .factory(   "tilesModel",     TileDataModel );

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

        toggleZoom( tilesModel[0] );

        preloadImages();


        // ************************************************************
        // Show Tile features
        // ************************************************************

        /**
         * Zoom the `#details` view simply by setting a $scope.state variable
         *
         */
        function showDetails( selectedTile ) {
            var request = promiseToNotify( "zoom", "complete." );

            $timeline( "zoom", {
                onUpdate          : makeNotify("zoom", "updating..."),
                onComplete        : request.notify
            });

            // Perform animation via state change
            $scope.selectedTile = selectedTile;
            $scope.state        = "zoom";

            return request.promise;
        }

        /**
         *  Unzoom the `#details` view simply by clearing the state
         */
        function hideDetails() {
            $timeline( "zoom", {
                onUpdate          : makeNotify("zoom", "reversing..."),
                onReverseComplete : makeNotify("zoom", "reversed.")
            });

            $scope.state = '-zoom';
        }


        /**
         * Zoom the tile details, pause, and then unzoom
         * This animation shows the users the UX that will result on
         * any tile click.
         *
         * @param tile
         */
        function toggleZoom( tile ) {
            $scope.preload( tile );

            // Wait while image loads are started...
            wait( 700 )
              .then( function() { return showDetails( tile );     })
              .then( function() { return wait( 100 );             })
              .then( hideDetails );

        }

        // ************************************************************
        // Image Features
        // ************************************************************

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

        function promiseToNotify(direction, action) {
            var deferred = $q.defer();

            return {
                promise : deferred.promise,
                notify  : function(tl){
                    $log.debug( "tl('{0}') {1}".supplant([direction, action || "finished"]));
                    deferred.resolve(tl);
                }
            };
        }
        /**
         * Reusable animation event callback for logging
         * @returns {Function}
         */
        function makeNotify (direction, action) {
            return function(tl) {
                $log.debug( "tl('{0}') {1}".supplant([direction, action || "finished"]));
            };
        }

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

        /**
         * Simply utility function wait with a promise
         * @param delay
         * @returns {Deferred.promise|*}
         */
        function wait (delay, value) {
            var deferred = $q.defer();
            $timeout(function(){
                deferred.resolve( value || true );
            },delay,false);
            return deferred.promise;
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
                from: {
                    left:-1,
                    top: 74,
                    width: 162,
                    height: 164
                },
                to  : { height : 216  },
                aria : {
                    artist: "Kodaline In a perfect world"
                },
                thumbSrc: "./assets/images/koda/thumb_kodaline_v8.png",
                albumSrc: "./assets/images/koda/album_kodaline.png",
                title: "Kodaline",

                titleSrc : "./assets/images/koda/title_kodaline.png",
                infoSrc : "./assets/images/koda/info_kodaline.png"
            },
            {
                className : "tile2",
                from: {
                    left: 164,
                    top: 74,
                    width: 161,
                    height: 164
                },
                to  : { height : 216  },
                aria : {
                    artist: "Moby Eighteen"
                },
                thumbSrc: "./assets/images/koda/thumb_moby_v8.png",
                albumSrc : "./assets/images/koda/album_moby_v2.png",
                titleSrc : "./assets/images/koda/title_moby.png",
                infoSrc : "./assets/images/koda/info_moby.png"
            },
            {
                className : "tile3",
                from: {
                    left:-1,
                    top: 240,
                    width: 162,
                    height: 162
                },
                to  : { height : 229  },
                aria : {
                    artist: "Supermodel Foster the People"
                },
                thumbSrc: "./assets/images/koda/thumb_supermodel_v8.png",
                albumSrc: "./assets/images/koda/album_supermodel.png",
                titleSrc : "./assets/images/koda/title_supermodel.png",
                infoSrc : "./assets/images/koda/info_supermodel.png"

            },
            {
                className : "tile4",
                from: {
                    left: 164,
                    top: 240,
                    width: 162,
                    height: 162
                },
                to  : { height : 229  },
                aria : {
                    artist: "Ellie Goulding Halycon Days"
                },
                thumbSrc: "./assets/images/koda/thumb_goulding_v8.png",
                albumSrc: "./assets/images/koda/album_goulding.png",
                titleSrc : "./assets/images/koda/title_goulding.png",
                infoSrc : "./assets/images/koda/info_goulding.png"
            },
            {
                className : "tile5",
                from: {
                    left:-1,
                    top: 404,
                    width: 162,
                    height: 162
                },
                to  : { height : 216  },
                aria : {
                    artist: "Goyte ft. Kimbra Somebody that I used to know."
                },
                thumbSrc: "./assets/images/koda/thumb_goyte_v8.png",
                albumSrc: "./assets/images/koda/album_goyte.png",
                titleSrc : "./assets/images/koda/title_goyte.png",
                infoSrc : "./assets/images/koda/info_goyte_v2.png"
            },
            {
                className : "tile6",
                from: {
                    left: 164,
                    top: 404,
                    width: 162,
                    height: 162
                },
                to  : { height : 216  },
                aria : {
                    artist: "Pharrell Williams GIRL"
                },
                thumbSrc: "./assets/images/koda/thumb_pharrell_v8.png",
                albumSrc: "./assets/images/koda/album_pharrell.png",
                titleSrc : "./assets/images/koda/title_pharrell.png",
                infoSrc : "./assets/images/koda/info_pharrell.png"
            }
        ];

        return model;       //CDNify(model);

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
