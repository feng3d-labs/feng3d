import { EventEmitter as Emitter } from '../Gozala/events';

const map = [
    'left',
    'middle',
    'right'
];

export function pressed(element, preventDefault)
{
    const mouse = new Emitter();

    mouse.left = false;
    mouse.right = false;
    mouse.middle = false;
    mouse.dispose = dispose;

    if (typeof window !== 'undefined')
    {
        element = element || window;
        element.addEventListener('mousedown', mousedown, false);
        window.addEventListener('mouseup', mouseup, false);

        if (preventDefault)
        {
            element.addEventListener('contextmenu', preventDefaulter, false);
        }
    }

    return mouse;

    function mousedown(e)
    {
        mouse.right = false;
        mouse[map[e.button]] = true;
        mouse.emit('down', e);

        if (!preventDefault) return;
        if (!e.preventDefault) return false;
        e.preventDefault();
        e.stopPropagation();
    }

    function mouseup(e)
    {
        mouse.right = false;
        mouse[map[e.button]] = false;
        mouse.emit('up', e);

        if (!preventDefault) return;
        if (!e.preventDefault) return;
        e.preventDefault();
        e.stopPropagation();
    }

    function preventDefaulter(e)
    {
        return e.preventDefault && e.preventDefault() && false;
    }

    function dispose()
    {
        mouse.left = false;
        mouse.right = false;
        mouse.middle = false;

        if (element)
        {
            element.removeEventListener('contextmenu', preventDefaulter, false);
            element.removeEventListener('mousedown', mousedown, false);
            window.removeEventListener('mouseup', mouseup, false);
        }
    }
}
