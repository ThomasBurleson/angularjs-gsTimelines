angular.module('timeline_drag', ['ng'])
       .service("dragBehavior", DragBehaviorService);

/**
 * Timeline Drag Features
 * @constructor
 */
function DragBehaviorService()
{
    return {
        attachTo : attachBehavior
    };

    /**
     *
     * @param scope
     * @param element
     * @param bubbles
     * @returns {cleanup}
     */
    function attachBehavior(scope, element, preventDefault) {
        // The state of the current drag & previous drag
        var drag;
        var previousDrag;
        // Whether the pointer is currently down on this element.
        var pointerIsDown;
        var START_EVENTS = 'mousedown touchstart pointerdown';
        var MOVE_EVENTS = 'mousemove touchmove pointermove';
        var END_EVENTS = 'mouseup mouseleave touchend touchcancel pointerup pointercancel';

        // Listen to move and end events on document. End events especially could have bubbled up
        // from the child.
        element.on(START_EVENTS, startDrag);
        $document.on(MOVE_EVENTS, doDrag)
            .on(END_EVENTS, endDrag);

        scope.$on('$destroy', cleanup);

        return cleanup;

        /**
         *
         */
        function cleanup() {
            if (cleanup.called) return;
            cleanup.called = true;

            drag = pointerIsDown = false;

            element.off(START_EVENTS, startDrag);
            $document.off(MOVE_EVENTS, doDrag)
                .off(END_EVENTS, endDrag);
        }

        /**
         *
         * @param ev
         */
        function startDrag(ev) {
            var eventType = ev.type.charAt(0);
            var now = Util.now();

            // iOS & old android bug: after a touch event, iOS sends a click event 350 ms later.
            // Don't allow a drag of a different pointerType than the previous drag if it has been
            // less than 400ms.

            if (previousDrag && previousDrag.pointerType !== eventType &&
                (now - previousDrag.endTime < 400)) {
                return;
            }
            if ( !pointerIsDown ) {

                pointerIsDown = true;

                drag = {
                    // Restrict this drag to whatever started it: if a mousedown started the drag,
                    // don't let anything but mouse events continue it.
                    pointerType: eventType,
                    startX: getPosition(ev),
                    startTime: now
                };

                element
                    .one('$tl.dragstart', function(ev) {
                        // Allow user to cancel by preventing default
                        if (ev.defaultPrevented) drag = null;
                    })
                    .triggerHandler('$tl.dragstart', drag);

                if ( preventDefault ) {
                    ev.preventDefault();
                    ev.stopImmediatePropagation();
                }
            }
        }

        /**
         *
         * @param ev
         */
        function doDrag(ev) {
            if (!drag || !isProperEventType(ev, drag)) return;

            if (drag.pointerType === 't' || drag.pointerType === 'p') {
                // No scrolling for touch/pointer events
                ev.preventDefault();
            }
            updateDragState(ev);
            element.triggerHandler('$tl.drag', drag);
        }

        /**
         *
         * @param ev
         */
        function endDrag(ev) {
            pointerIsDown = false;
            if (!drag || !isProperEventType(ev, drag)) return;

            drag.endTime = Util.now();
            updateDragState(ev);

            element.triggerHandler('$tl.dragend', drag);

            previousDrag = drag;
            drag = null;
        }

        /**
         *
         * @param ev
         */
        function updateDragState(ev) {
            var x = getPosition(ev);
            drag.distance = drag.startX - x;
            drag.direction = drag.distance > 0 ? 'left' : (drag.distance < 0 ? 'right' : '');
            drag.duration = drag.startTime - Util.now();
            drag.velocity = Math.abs(drag.duration) / drag.time;
        }

        /**
         *
         * @param ev
         * @returns {Number|pageX|*|_tempEvent.pageX|c.pageX}
         */
        function getPosition(ev) {
            ev = ev.originalEvent || ev; //support jQuery events
            var point = (ev.touches && ev.touches[0]) ||
                (ev.changedTouches && ev.changedTouches[0]) ||
                ev;
            return point.pageX;
        }

        /**
         *
         * @param ev
         * @param drag
         * @returns {*|boolean}
         */
        function isProperEventType(ev, drag) {
            return drag && ev && (ev.type || '').charAt(0) === drag.pointerType;
        }
    }
}
