$(function(){
    var hideDetails;

    scaleStage();

    // Open Details view upon tile clicks
    // Auto-close details view upon ESCAPE keydowns

    $("#tile1").click(function(){   showDetails(0); });
    $("#tile2").click(function(){   showDetails(1); });
    $("#tile3").click(function(){   showDetails(2); });
    $("#tile4").click(function(){   showDetails(3); });

    // Auto-hide details on Escape keydown

    $(document).keyup(function(e) {
        if (e.keyCode == 27) { hideDetails(); }
    });

    /**
     * Run custom `Show Details` view transitions
     */
    function showDetails(tile) {
        getTransitionsFor(tile).then(function(transitions){
            var enter = transitions.enter,
                details = document.getElementById("details");

            details.onclick = hideDetails = function() {
                if (enter.isActive() ) enter.pause();
                transitions.leave.restart();
            };

            enter.restart();
        });
    }

    // **************************************************
    // Build Animation Timelines
    // **************************************************


    var tiles = [
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
                left:164,
                top: 75,
                width: 161,
                height: 186
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


    /**
     * Get a promise for the enter & leave transitions...
     * which will be resolved when the transitions are ready!
     *
     * @param tile
     * @returns {*}
     */
    function getTransitionsFor(tile) {
        var options = tiles[tile];
        var dfd = Q.defer();

        if ( !options.transitions ) {
            options.transitions = buildTransitions(options);
        }

        // Update the background image for the `title` div

        $("#stage div#title > .content").css("background-image", "url(" + options.titleSrc + ")");
        $("#stage div#info  > .content").css("background-image", "url(" + options.infoSrc + ")");

        // Use a promise to start the transition ONCE the full album image has
        // already loaded and the img `src` attribute has been updated...

        if ( !options.imageLoaded ) {
            $("#details > img")
                .load(function(){
                    // Manually track load status
                    options.imageLoaded = true;
                    dfd.resolve(options.transitions);
                })
                .attr("src", options.albumSrc);
        } else {
            $("#details > img").attr("src", options.albumSrc);
            dfd.resolve(options.transitions);
        }

        return dfd.promise;
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

        var zoom = new TimelineLite({paused:true}),
            unzoom = new TimelineLite({paused:true});

        var from = options.from,
            to   = options.to;

        // Do zoom to show Kodaline details...

        zoom.timeScale(1)
            .set(mask,             { zIndex:90, className:""})
            .set(details,          options.from )
            .set(details,          { className:"" })
            .to( details,  0.2,    { opacity:1} )
            .to( details,  0.3,    { left:0, height:to.height, width:323 } )
            .addLabel("fullWdith")
            .to( mask,        0.5, { opacity:0.80 },        "fullWidth-=0.3" )
            .to( details,     0.3, { top:18, height:512 },  "fullWidth-=0.05" )
            .addLabel("slideIn")
            .set(green,            { zIndex:92, opacity:1.0, top:21, className:"" })
            .to( green,       0.2, { top:0 },                "slideIn" )
            .to( title,       0.6, { height:131 },           "fullWdith")
            .to( info,        0.5, { height:56 },            "fullWdith+=0.2")
            .to( title_cnt,   0.8, { opacity:1 },            "fullWdith+=0.3")
            .to( pause,       0.4, { opacity:1, scale:1.0 }, "fullWidth+=0.4")
            .to( info_cnt,    1.0, { opacity:1 },            "fullWdith+=0.6");

        // Reverse zoom to close details and show grid...

        unzoom.timeScale(1.4)
            .addLabel("start")
            .to( green,     0.2, { opacity:0.0, top:21, className:"hidden"} )
            .to( pause,     0.1, { opacity:0, scale:0.4 },           "start")
            .to( title_cnt, 0.1, { opacity:0 },                      "start")
            .to( info_cnt,  0.1, { opacity:0 },                      "start")
            .to( info,      0.2, { height:0 },                       "start+=0.1")
            .to( title,     0.2, { height:0 },                       "start+=0.2")
            .to( details,   0.3, { top:from.top, height:to.height }, "start+=0.2")
            .to( details,   0.3, { left:from.left,  width:from.width, height:from.height, ease:"Sine.easeIn"})
            .to( mask,      0.5, { opacity:0.0, ease:"Sine.easeIn"},0.5)
            .set( mask,          { zIndex:0, className:"hidden" })
            .to( details,   0.3, { opacity:0})
            .set( details,       { className:"hidden" });

        return { enter : zoom, leave : unzoom };
    }


    // **************************************************
    // View Port Scaling
    // **************************************************

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

});
