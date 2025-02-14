// @see https://github.com/mikolalysenko/mouse-wheel.git

import { toPX } from './to-px';

export function mouseWheelListen(element, callback?, noScroll?)
{
    if (typeof element === 'function')
    {
        noScroll = !!callback;
        callback = element;
        element = window;
    }

    const lineHeight = toPX('ex');
    const listener = (ev) =>
    {
        if (noScroll)
        {
            ev.preventDefault();
        }
        let dx = ev.deltaX || 0;
        let dy = ev.deltaY || 0;
        let dz = ev.deltaZ || 0;
        const mode = ev.deltaMode;
        let scale = 1;
        switch (mode)
        {
            case 1:
                scale = lineHeight;
                break;
            case 2:
                scale = window.innerHeight;
                break;
        }
        dx *= scale;
        dy *= scale;
        dz *= scale;
        if (dx || dy || dz)
        {
            return callback(dx, dy, dz, ev);
        }
    };
    element.addEventListener('wheel', listener);

    return listener;
}
