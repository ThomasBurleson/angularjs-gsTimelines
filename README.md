# Designing a UX Animation DSL

## Summary

The goal is the development of a next-generation of Animation features for AngularJS... with functionality and power to easily develop UX as demonstrated in [Material Design](http://www.google.com/design/spec/material-design/introduction.html) and the [Polymer Topeka Quiz](https://www.polymer-project.org/apps/topeka/) app.

New animation requirements and a viable DSL (for AngularJS ngAnimate) will be derived from experiments and explorations of real-world UX animation samples using the following three (3) Animation libraries:

*  [Greensock GSAP](https://github.com/greensock/GreenSock-JS)
*  [Polymer WebAnimations](https://github.com/web-animations/web-animations-js)
*  [Famo.us](http://famo.us/)

For these experiments, two (2) real-world UX applications were selected from Material Design: 
![dsl_ideas](https://cloud.githubusercontent.com/assets/210413/5424470/0d8c746e-82b6-11e4-92ba-3c76a5b89807.jpg)

Each application will be implemented with the three (3) Animation libraries show above. These implementations will be used to identify core animation APIs and features. And that API will, in turn, be used to derive a XML-based Animation DSL.

## 1) Koda & GSAP 

Use Greensock's (**GSAP**) `TimelineLite` to demonstrate the use of animation timelines to build complex transitions. These animation implementations will be used to create a DSL API... achieved by exploring the API usages & complexities of functionality required to create desired effects and UX.

Here are some quick links to source or demos for the experiments:

| Description | HTML | Javascript | Live Demos | DSL |
|--------|--------|--------|--------|--------|
| jQuery application with click animation | [koda_1.html](src/koda_1.html) |  [koda_1.js](src/assets/js/koda_1.js) | [CodePen #1](http://codepen.io/ThomasBurleson/pen/OPMgqj) | [Koda #1](https://github.com/ThomasBurleson/angularjs-animations-dsl/tree/master/docs/dsl) | 
| AngularJS application with Timeline slider controls | [koda_2.html](src/koda_2.html) |  [koda_2.js](src/assets/js/koda_2.js) |  | |
| AngularJS application with Timeline Drag features | [koda_3.html](src/koda_3.html) |  [koda_3.js](src/assets/js/koda_3.js) |  | |
<br/>
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

#### Run Locally

Open Terminal console in the project directory.

```sh
bower update
http-server -d ./
```

Open Browser and navigate to URL `http://localhost:8080/`
