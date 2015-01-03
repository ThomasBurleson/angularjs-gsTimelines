# Designing an AngularJS Animation DSL

## Summary

The goal is the development of a *next-generation* Animation layer for AngularJS... with functionality and power to easily develop rich UX... as demonstrated in [Material Design](http://www.google.com/design/spec/material-design/introduction.html) and the [Polymer Topeka Quiz](https://www.polymer-project.org/apps/topeka/) app.

[Meaningful transitions](http://www.google.com/design/spec/animation/meaningful-transitions.html) establish visual continuity with and during transitions between two visual states.  Carefully choreographed motion design can effectively guide the user’s attention and focus through multiple steps of a process or procedure, avoid confusion when layouts change or elements are rearranged, and improve the overall beauty of the experience

Highlighted in Material Design is a user experience (UX) that is achieved using the 'Reveal' pattern. Reveal animations provide users visual continuity when you show or hide a group of UI elements... Reveal animations often involve complex choreographies with hierarchical timing; where elements are removed, added, or shared between the animation states. 

The Koda application developed below uses the [Reveal effect](http://developer.android.com/training/material/animations.html#Reveal) and provides a UX composed of complex motions.

New Animation API requirements and a viable **DSL** (domain-specific-language layered on top of AngularJS ngAnimate) will be derived from experiments and explorations of real-world UX animation samples using the following three (3) Animation libraries:

*  [Greensock GSAP](https://github.com/greensock/GreenSock-JS)
*  [Polymer WedAnimations](https://www.polymer-project.org/platform/web-animations.html), [GitHub  WebAnimations](https://github.com/web-animations/web-animations-js)
*  [Famo.us](http://famo.us/)

For these experiments, two (2) real-world UX applications were selected from Material Design: 
![dsl_ideas](https://cloud.githubusercontent.com/assets/210413/5424470/0d8c746e-82b6-11e4-92ba-3c76a5b89807.jpg)

Each application will be implemented with the three (3) Animation libraries show above. These implementations will be used to identify core animation APIs and features. And that API will, in turn, be used to derive a XML-based Animation DSL.

#### From Javascript to DSL 

Consider the Koda JavaScript use of the Greensock TimeLine API:

```js
var zoom = new TimelineLite({paused:true}),
    unzoom = new TimelineLite({paused:true});

// Do zoom to show Kodaline details...

zoom.timeScale(1)
    .set($("#mask"),                               { zIndex:90, className:""})
    .set($("#details"),                            { height:162, opacity:0, width:162 } )
    .set($("#details"),                            { className:"" })
    .to( $("#details"),                       0.2, { opacity:1} )
    .to( $("#details"),                       0.3, { left:0, height:210, width:323 } )
    .addLabel("fullWdith")
    .to( $("#mask"),                          0.5, { opacity:0.80 },        "fullWidth-=0.3" )
    .to( $("#details"),                       0.3, { top:18, height:512 },  "fullWidth-=0.05" )
    .addLabel("slideIn")
    .set($("#details > #green"),                   { zIndex:92, opacity:1.0, top:21, className:"" })
    .to( $("#details > #green"),              0.2, { top:0 },                "slideIn" )
    .to( $("#details > #tile"),               0.6, { height:131 },           "fullWdith")
    .to( $("#details > #info"),               0.5, { height:56 },            "fullWdith+=0.2")
    .to( $("#details > #title > div.content"),0.8, { opacity:1 },            "fullWdith+=0.3")
    .to( $("#details > #pause"),              0.4, { opacity:1, scale:1.0 }, "fullWidth+=0.4")
    .to( $("#details > #info > div.content"), 1.0, { opacity:1 },            "fullWdith+=0.6");
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

This DSL is much more expressive and, more importantly, is embedded within the **HTML** markup adjacent to the DOM elements that will transitioned... 

>Note: some of the parameters (eg. Line #69) support AngularJS interpolation symbols and data-binding. This is powerful feature over the javascript-approach... timelines will be automatically updated when scope variables are modified. This, in turn, means that the timeline can be applied to 1..n targets. In the case of Koda, the timeline is applied to any of the gridlist tiles.

Instead of the current separation of animation logic (and element manipulation) to *.js, we can express both the UI and the UX transitions within the UI layers of the client.

*  More details on the Animation DLS can be found here: [Animation DSL](https://github.com/ThomasBurleson/angularjs-animations-dsl/tree/master/docs/dsl)
*  Source to the AngularJS-GSAP **gsTimeline** features can be found here: [src/assets/js/tools/timelines.js](src/assets/js/tools/timelines.js)

---

## Animation States

Leveraging the concept of associating views and view layouts with states of the application, transitions of states can be defined that animate elements and their properties. Changes between states can trigger animations...

Such solutions can be seen in the:

*  [Flex States](http://www.adobe.com/devnet/flex/videotraining/exercises/ex4_10.html) in the Flash technology platform.
*  [Android View States](http://developer.android.com/training/material/animations.html#ViewState) in the Android Developers platform.

With the features provided by **gsTimeline** library, animation states can be consider as specific groupings of transitions. 

The [Koda #4](src/koda_4.html#L15) sample uses Animation states to define a `zoom` state that shows the tile details zoomed full screen. Simply set the `$scope.state = 'zoom'` to trigger the animations associated with that state.

```js
$timeline( "zoom", {
    onUpdate          : makeNotify("zoom", "updating..."),
    onComplete        : makeNotify("zoom", "complete.")
});

// Perform animation via state change
$scope.state        = "zoom";
$scope.selectedTile = selectedTile;
```

---

## The Koda Application

#### Koda with GreenSock GSAP 

Use Greensock's (**GSAP**) `TimelineLite` within a Gridlist application and demonstrate the use of animation timelines to build complex transitions. Here are some quick links to source or demos for the experiments:

| Description | HTML | Javascript | Live Demos |
|--------|--------|--------|--------|
| jQuery app with click animation | [koda_1.html](src/koda_1.html) |  [koda_1.js](src/assets/js/koda_1.js) | [CodePen #1](http://codepen.io/ThomasBurleson/pen/OPMgqj) |
| AngularJS app with Timeline slider controls | [koda_2.html](src/koda_2.html) |  [koda_2.js](src/assets/js/koda_2.js) | [CodePen #2](http://codepen.io/ThomasBurleson/pen/ByKVGg)  |
| AngularJS app with DSL |  [koda_3.html](src/koda_3.html#L14) |  [koda_3.js](src/assets/js/koda_3.js#L75-83) |  |
| AngularJS app with DSL & States |  [koda_4.html](src/koda_4.html#L15) |  [koda_4.js](src/assets/js/koda_4.js#L52-53) | [CodePen #4](http://codepen.io/ThomasBurleson/pen/jEVyjr/?editors=101)  |
<br/>
![dsl_codepen_2](https://cloud.githubusercontent.com/assets/210413/5424494/e88af0e0-82b6-11e4-9164-3b7af111037f.jpg)

---

#### Functional Considerations

While exploring the animation API requirements, the implemenation should also consider other functional requirements:

**Koda #1**

- Load images in background so zoom works quickly
- Use promises to delay transitions until the images are ready
- Dynamically modify timescale so unzoom is faster
- Use of global keypress to unzoom/reverse the timeline
- Use data model to dynamically define tile zoom from/to transitions

**Koda #2 Only**

- Plugin use of Timeline Slider controls; independent of TimelineController
  - Sync Slider to transition timeline
  - Use slider to manually sequence through transition frames

**Koda #3 Only**

- Use of AngularJS-GSAP `$timeline` service to parse animation DSL (in HTML) and build animations with databindings to scope and data models. Uses programmatic approach to trigger animations:
```js
$timeline( "zoom", {

  onComplete        : makeNotify("zoom"),
  onReverseComplete : makeNotify("unzoom"),
  onUpdate          : makeNotify("zoom", "update")

}).then( function(animation){
    animation.restart();
});
```

**Koda #4 Only**

- Use of AngularJS-GSAP `$timeline` service (again) but with feature support for Animation States. Now uses state name changes to trigger animations:
```js
$timeline( "zoom", {
    onUpdate          : makeNotify("zoom", "updating..."),
    onComplete        : makeNotify("zoom", "complete.")
});

// Perform animation via state change
$scope.state        = "zoom";
$scope.selectedTile = selectedTile;
```

---

## Tips to Run Locally

Open Terminal console in the project directory.

```sh
bower update
http-server -d ./
```

Open Browser and navigate to URL `http://localhost:8080/`

---

## Debugging

By default the `$timeline()` service and process outputs to the console:

```console
>> TimelineBuilder::makeTimeline() invoked by $timeline('0')
TimelineStates::watchState( state = 'zoom' )
loading $( #backgroundLoader ).src = http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/album_kodaline.png
 $('#backgroundLoader').loaded() 
loading $( #backgroundLoader ).src = http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/album_moby_v2.png
 $('#backgroundLoader').loaded() 
>> TimelineBuilder::makeTimeline() invoked by $timeline('zoom')
timeline.set( '#mask', 0.001,  {"zIndex":"-10","className":""}, '' )
timeline.set( '#details', 0.001,  {"zIndex":"-11","className":""}, '' )
timeline.set( '#green_status', 0.001,  {"zIndex":"-13","className":""}, '' )
timeline.set( '#other', 0.001,  {"top":"481","left":"88","opacity":"1.0"}, '' )
timeline.set( '#mask', 0.001,  {"zIndex":"90"}, '' )
timeline.set( '#details', 0.01,  {"zIndex":"92","opacity":"0.01","top":"-1"}, '' )
timeline.set( '#details', 0.3,  {"opacity":"1.0"}, '' )
addLabel( 'fullThumb' )
timeline.set( '#other', 0.2,  {"top":"532","left":"324"}, '' )
timeline.set( '#other', 0.1,  {"opacity":"0"}, 'fullThumb+=0.1' )
timeline.set( '#details', 0.5,  {"delay":"0.3","left":"0","width":"329"}, '' )
addLabel( 'fullWidth' )
timeline.set( '#mask', 0.5,  {"opacity":"0.80"}, 'fullWidth-=0.3' )
timeline.set( '#details', 0.3,  {"opacity":"1","top":"18","height":"512"}, 'fullWidth+=0.1' )
addLabel( 'slideIn' )
timeline.set( '#green_status', 0.001,  {"zIndex":"91","opacity":"1","top":"21"}, 'slideIn' )
timeline.set( '#green_status', 0.2,  {"top":"1"}, 'slideIn' )
timeline.set( '#details > #title', 0.6,  {"height":"131"}, 'fullWidth' )
timeline.set( '#details > #info', 0.5,  {"height":"56"}, 'fullWidth+=0.2' )
timeline.set( '#details > #title > div.content', 0.8,  {"opacity":"1.0"}, 'fullWidth+=0.3' )
timeline.set( '#details > #info > div.content', 0.4,  {"opacity":"1"}, 'fullWidth+=0.6' )
timeline.set( '#details > #pause', 0.4,  {"opacity":"1","scale":"1.0"}, 'fullWidth+=0.4' )
loading $( #backgroundLoader ).src = http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/album_supermodel.png
 $('#backgroundLoader').loaded() 
loading $( #backgroundLoader ).src = http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/album_goulding.png
 $('#backgroundLoader').loaded() 
loading $( #backgroundLoader ).src = http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/album_goyte.png
 $('#backgroundLoader').loaded() 
loading $( #backgroundLoader ).src = http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/album_pharrell.png
 $('#backgroundLoader').loaded() 
updating $(#details > img).src = 'http://solutionoptimist-bucket.s3.amazonaws.com/kodaline/album_kodaline.png'
>> TimelineStates::triggerTimeline( state = 'zoom' )
tl('zoom') updating...
>> TimelineBuilder::makeTimeline() invoked by $timeline('zoom')
timeline.set( '#mask', 0.001,  {"zIndex":"-10","className":""}, '' )
timeline.set( '#details', 0.001,  {"zIndex":"-11","className":""}, '' )
timeline.set( '#green_status', 0.001,  {"zIndex":"-13","className":""}, '' )
timeline.set( '#other', 0.001,  {"top":"481","left":"88","opacity":"1.0"}, '' )
timeline.set( '#mask', 0.001,  {"zIndex":"90"}, '' )
timeline.set( '#details', 0.01,  {"zIndex":"92","opacity":"0.01","left":"0","top":"73","width":"162","height":"164"}, '' )
timeline.set( '#details', 0.3,  {"opacity":"1.0"}, '' )
addLabel( 'fullThumb' )
timeline.set( '#other', 0.2,  {"top":"532","left":"324"}, '' )
timeline.set( '#other', 0.1,  {"opacity":"0"}, 'fullThumb+=0.1' )
timeline.set( '#details', 0.5,  {"delay":"0.3","left":"0","height":"216","width":"329"}, '' )
addLabel( 'fullWidth' )
timeline.set( '#mask', 0.5,  {"opacity":"0.80"}, 'fullWidth-=0.3' )
timeline.set( '#details', 0.3,  {"opacity":"1","top":"18","height":"512"}, 'fullWidth+=0.1' )
addLabel( 'slideIn' )
timeline.set( '#green_status', 0.001,  {"zIndex":"91","opacity":"1","top":"21"}, 'slideIn' )
timeline.set( '#green_status', 0.2,  {"top":"1"}, 'slideIn' )
timeline.set( '#details > #title', 0.6,  {"height":"131"}, 'fullWidth' )
timeline.set( '#details > #info', 0.5,  {"height":"56"}, 'fullWidth+=0.2' )
timeline.set( '#details > #title > div.content', 0.8,  {"opacity":"1.0"}, 'fullWidth+=0.3' )
timeline.set( '#details > #info > div.content', 0.4,  {"opacity":"1"}, 'fullWidth+=0.6' )
timeline.set( '#details > #pause', 0.4,  {"opacity":"1","scale":"1.0"}, 'fullWidth+=0.4' )
tl('zoom') updating...
tl('zoom') complete.
```
