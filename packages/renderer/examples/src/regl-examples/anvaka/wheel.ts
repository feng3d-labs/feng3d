/**
 * This module unifies handling of mouse whee event accross different browsers
 *
 * See https://developer.mozilla.org/en-US/docs/Web/Reference/Events/wheel?redirectlocale=en-US&redirectslug=DOM%2FMozilla_event_reference%2Fwheel
 * for more details
 *
 * Usage:
 *  var addWheelListener = require('wheel');
 *  addWheelListener(domElement, function (e) {
 *    // mouse wheel event
 *  });
 */

let prefix = '';
let _addEventListener;

// detect event model
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (window.addEventListener)
{
    _addEventListener = 'addEventListener';
}
else
{
    _addEventListener = 'attachEvent';
    prefix = 'on';
}

// detect available wheel event
const support = 'onwheel' in document.createElement('div') ? 'wheel' // Modern browsers support "wheel"
    // eslint-disable-next-line dot-notation
    : document['onmousewheel'] !== undefined ? 'mousewheel' // Webkit and IE support at least "mousewheel"
        : 'DOMMouseScroll'; // let's assume that remaining browsers are older Firefox

export function addWheelListener(elem, callback, useCapture)
{
    _addWheelListener(elem, support, callback, useCapture);

    // handle MozMousePixelScroll in older Firefox
    if (support === 'DOMMouseScroll')
    {
        _addWheelListener(elem, 'MozMousePixelScroll', callback, useCapture);
    }
}

function _addWheelListener(elem, eventName, callback, useCapture)
{
    elem[_addEventListener](prefix + eventName, support === 'wheel' ? callback : function (originalEvent)
    {
        !originalEvent && (originalEvent = window.event);

        // create a normalized event object
        const event = {
            deltaY: 0,
            // keep a ref to the original event object
            originalEvent,
            target: originalEvent.target || originalEvent.srcElement,
            type: 'wheel',
            deltaMode: originalEvent.type === 'MozMousePixelScroll' ? 0 : 1,
            deltaX: 0,
            delatZ: 0,
            preventDefault()
            {
                originalEvent.preventDefault
                    ? originalEvent.preventDefault()
                    : originalEvent.returnValue = false;
            }
        };

        // calculate deltaY (and deltaX) according to the event
        if (support === 'mousewheel')
        {
            event.deltaY = -1 / 40 * originalEvent.wheelDelta;
            // Webkit also support wheelDeltaX
            originalEvent.wheelDeltaX && (event.deltaX = -1 / 40 * originalEvent.wheelDeltaX);
        }
        else
        {
            event.deltaY = originalEvent.detail;
        }

        // it's time to fire the callback
        return callback(event);
    }, useCapture || false);
}

