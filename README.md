# Designing a UX Animation DSL

## Summary

The goal is the development of a next-generation of Animation features for AngularJS... with functionality and power to easily develop UX as demonstrated in [Material Design](http://www.google.com/design/spec/material-design/introduction.html) and the [Polymer Topeka Quiz](https://www.polymer-project.org/apps/topeka/) app.

New animation requirements and a viable DSL (for AngularJS ngAnimate) will be derived from experiments and explorations of real-world UX animation samples using the following three (3) Animation libraries:

*  [Greensock GSAP](https://github.com/greensock/GreenSock-JS)
*  [Polymer WebAnimations](https://github.com/web-animations/web-animations-js)
*  [Famo.us](http://famo.us/)


![dsl_ideas](https://cloud.githubusercontent.com/assets/210413/5424470/0d8c746e-82b6-11e4-92ba-3c76a5b89807.jpg)

## Greensock API

Use Greensock's (**GSAP**) `TimelineLite` to demonstrate the use of animation timelines to build complex transitions. These animation implementations will be used to create a DSL API... achieved by exploring the API usages & complexities of functionality required to create desired effects and UX.

Here are some quick links to experiments used:

| Description | HTML | Javascript | Live Demos |
|--------|--------|--------|--------|
| **jQuery** app with click animation | [Koda #1](src/koda_1.html) |  [Koda #1](src/assets/js/koda_1.js) | [Koda_1](http://codepen.io/ThomasBurleson/pen/OPMgqj) |
| **AngularJS** app with Timeline slider controls | [Koda #2](src/koda_2.html) |  [Koda #2](src/assets/js/koda_2.js) |  |
| **AngularJS** app with Timeline Drag features | [Koda #3](src/koda_3.html) |  [Koda #3](src/assets/js/koda_3.js) |  |
---

Koda_1 CodePen:

![dsl_codepen_2](https://cloud.githubusercontent.com/assets/210413/5424494/e88af0e0-82b6-11e4-9164-3b7af111037f.jpg)

---

#### Functional Considerations

While exploring the animation API requirements, the implemenation should also consider other functional requirements:

- Load images in background so zoom works quickly
- Use promises to delay transitions until the images are ready
- Dynamically modify timescale so unzoom is faster
- Use of global keypress to unzoom/reverse the timeline
- Use tile data model to define dynamic zoom from/to information
- Plugin use of Timeline Slider controls; independent of TimelineController
  - Sync Slider to transition timeline
  - Use slider to manually sequence through transition frames
- Support to drag on image to manually sequence through transitions

### Run Locally

Open Terminal console in the project directory.

```sh
bower update
http-server -d ./
```

Open Browser and navigate to URL `http://localhost:8080/`
