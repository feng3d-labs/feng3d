// @see https://github.com/hughsk/mouse-position

import { EventEmitter as Emitter } from '../Gozala/events';

export function attach(element, listener?)
{
    const position = new Emitter();

    position[0] = 0;
    position[1] = 0;
    position.prev = [0, 0];
    position.flush = flush;
    position.dispose = dispose;

    if (typeof window === 'undefined')
    {
        return position;
    }

    listener = listener || element || window;
    element = element || document.body;
    const handler = (element === document.body || element === window
    ) ? function (e)
    {
        position.prev[0] = position[0];
        position.prev[1] = position[1];
        position[0] = e.clientX;
        position[1] = e.clientY;
        position.emit('move', e);
    }
        : function (e)
        {
            position.prev[0] = position[0];
            position.prev[1] = position[1];
            const bounds = element.getBoundingClientRect();
            position[0] = e.clientX - bounds.left;
            position[1] = e.clientY - bounds.top;
            position.emit('move', e);
        };
    listener.addEventListener('mousemove', handler, false);

    return position;

    function flush()
    {
        position.prev[0] = position[0];
        position.prev[1] = position[1];
    }

    function dispose()
    {
        position.removeAllListeners('move');
        listener.removeEventListener('mousemove', handler);
    }
}
