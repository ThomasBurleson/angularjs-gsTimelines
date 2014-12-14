## Animation DSL

The goal is to identify an HTML-level DSL that conforms in power and features to the Javascript API typically used for animations and UX transitions. 

Quick Link:  [Full-version of Koda DSL](koda_timelines.xml)

#### From Javascript to DSL 

Consider the JavaScript usages of the Greensock TimeLine API below:

> See [Koda #2 Live Demo](http://codepen.io/ThomasBurleson/pen/OPMgqj) - Javascript-based version

```js
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
```            

We can this express this same transition as an HTML-based DSL:

```xml
<!-- AngularJS Koda SPA  -->

<body ng-app="kodaline">

 <!-- Animation DSL -->

 <timeline state="enter"
          time-scale="1"
          resolve="preloadImages(source)"
          cache="true" >
    <!-- timelines for #mask and #details run in parallel -->

    <timeline target="#mask" position="">

      <step                                          style="z-index:90;" class="" />
      <step duration="0.5"                           style="opacity:0.8;" position="300" />

    </timeline>
    <timeline target="#details" position="">

      <!-- frame #details as overlay above thumbnail of tile `source` element -->

      <step                                          style="opacity:1; left:{{source.left}}; top:{{source.top}}; width:{{source.width}}; height:{{source.height}};" class="" />
      <step                                          style="left:0; height:210; width:323;" duration="0.3"  />
      <step mark-position="fullWidth"/>
      <step                                          style="top:18; height:512" duration="300" position="fullWidth-=0.3"/>
      <step mark-position="slideIn"/>
      <step target="#details > #green"               style="z-index:92; opacity:1; top:21;" class="" />
      <step target="#details > #green"               style="top:0;" />
      <step target="#details > #title"               style="height:131;"  duration="200" position="fullWidth" />
      <step target="#details > #info"                style="height:56;"   duration="0.6" position="fullWidth+=0.2" />
      <step target="#details > #title > div.content" style="opacity:1.0;" duration="500" position="fullWidth+=0.3" />
      <step target="#details > #pause"               style="opacity:0.8;" duration="800" position="fullWidth+=0.4" />
      <step target="#details > #info > div.content"  style="opacity:0;"   duration="0.4" position="fullWidth+=0.6" />

    </timeline>
 </timeline>

 <!-- UI View Elements --> 

 <div id="stage" ng-controller="TimelineController" >

    <!-- Tile Grid View -->
    <div id="status" class="status"></div>
    <div id="header"></div>

    <div class="tile1" ng-click="showDetails(0)" ></div>
    <div class="tile2" ng-click="showDetails(1)" ></div>
    <div class="tile3" ng-click="showDetails(2)" ></div>
    <div class="tile4" ng-click="showDetails(3)" ></div>

    <div id="other"></div>
    <div id="footer"></div>

    <!-- Tile Grid Mask -->
    <div id="mask" class="hidden"></div>

    <!-- Tile Details View -->
    <div id="green_status" class="hidden"></div>
    <div id="details" class="hidden">


```

Instead of the current separation of animation logic (and element manipulation) to `<script>.js`, we can express both the UI and the UX transitions within the UI layers of the client: `<html>.html`.

Some of the parameters (eg. Line #69) support AngularJS interpolation symbols and data-binding. This is powerful feature over the javascript-approach... timelines will be automatically updated when scope variables are modified. This, in turn, means that the timeline can be applied to 1..n targets. In the case of Koda, the timeline is applied to any of the gridlist tiles.

More information and discussions on the `position` attribute and its origination from the GSAP architecture can be found here: [Timeline Tip: Understanding the Position Parameter](http://greensock.com/position-parameter)

---

### DSL Heuristics

#### Transition Overlays:

Note that `position` attribute is a complex attribute that allows a step transition to start relative to the defined position; which can be:
-  an absolute value that corresponds to an offset for the start of the timeline:  `position="0.3"`
-  a label value that corresponds to a frame with the specified label:  `position="start"`
-  a label and offset value that corresponds to a time offset from the labelled frame:  `position="start=+0.2"`

If a `position` is not defined, then the step will be placed in the timeline queue based on aggregate durations of all preceding steps.

#### Additional rules:

-  All nested sibling timelines with `position=""` start at parent starttime and run in parallel.
- `<step>` can nest child timelines; which will be started at when the `step` frame is reached.
-  If a step does specify a `target` then the `timeline` target is used.
-  if a step does not specify a `duration` then the changes are immediate (duration === 0).

Reference values for complex selectors (e.g. `#details > #info`) are cached for subsequent step usages.


## Additional APIs

The DSL above is based on usages and API of GSAP (GreenSock Animation Platform).

> An important consideration to note is the the GSAP developer(s) have been publishing Flash Animation code since for &gt; 10 years and its Javascript equivalents for &gt; 3 years. The GSAP API will is mature, rich, and is based on real-world validation from tens-of-thousands of developers and designers.

The Polymer WebAnimations API must be reviewed and studied to identify parity and mismatches of functionality/features.
