// @see https://github.com/mikolalysenko/mouse-change.git

import * as mouse from './mouse-event';

export function mouseListen(element?, callback?)
{
    if (!callback)
    {
        callback = element;
        element = window;
    }

    let buttonState = 0;
    let x = 0;
    let y = 0;
    const mods = {
        shift: false,
        alt: false,
        control: false,
        meta: false
    };
    let attached = false;

    function updateMods(ev)
    {
        let changed = false;
        if ('altKey' in ev)
        {
            changed = changed || ev.altKey !== mods.alt;
            mods.alt = !!ev.altKey;
        }
        if ('shiftKey' in ev)
        {
            changed = changed || ev.shiftKey !== mods.shift;
            mods.shift = !!ev.shiftKey;
        }
        if ('ctrlKey' in ev)
        {
            changed = changed || ev.ctrlKey !== mods.control;
            mods.control = !!ev.ctrlKey;
        }
        if ('metaKey' in ev)
        {
            changed = changed || ev.metaKey !== mods.meta;
            mods.meta = !!ev.metaKey;
        }

        return changed;
    }

    function handleEvent(nextButtons, ev)
    {
        const nextX = mouse.x(ev);
        const nextY = mouse.y(ev);
        if ('buttons' in ev)
        {
            nextButtons = ev.buttons | 0;
        }
        if (nextButtons !== buttonState
            || nextX !== x
            || nextY !== y
            || updateMods(ev))
        {
            buttonState = nextButtons | 0;
            x = nextX || 0;
            y = nextY || 0;
            callback && callback(buttonState, x, y, mods);
        }
    }

    function clearState(ev)
    {
        handleEvent(0, ev);
    }

    function handleBlur()
    {
        if (buttonState
            || x
            || y
            || mods.shift
            || mods.alt
            || mods.meta
            || mods.control)
        {
            x = y = 0;
            buttonState = 0;
            mods.shift = mods.alt = mods.control = mods.meta = false;
            callback && callback(0, 0, 0, mods);
        }
    }

    function handleMods(ev)
    {
        if (updateMods(ev))
        {
            callback && callback(buttonState, x, y, mods);
        }
    }

    function handleMouseMove(ev)
    {
        if (mouse.buttons(ev) === 0)
        {
            handleEvent(0, ev);
        }
        else
        {
            handleEvent(buttonState, ev);
        }
    }

    function handleMouseDown(ev)
    {
        handleEvent(buttonState | mouse.buttons(ev), ev);
    }

    function handleMouseUp(ev)
    {
        handleEvent(buttonState & ~mouse.buttons(ev), ev);
    }

    function attachListeners()
    {
        if (attached)
        {
            return;
        }
        attached = true;

        element.addEventListener('mousemove', handleMouseMove);

        element.addEventListener('mousedown', handleMouseDown);

        element.addEventListener('mouseup', handleMouseUp);

        element.addEventListener('mouseleave', clearState);
        element.addEventListener('mouseenter', clearState);
        element.addEventListener('mouseout', clearState);
        element.addEventListener('mouseover', clearState);

        element.addEventListener('blur', handleBlur);

        element.addEventListener('keyup', handleMods);
        element.addEventListener('keydown', handleMods);
        element.addEventListener('keypress', handleMods);

        if (element !== window)
        {
            window.addEventListener('blur', handleBlur);

            window.addEventListener('keyup', handleMods);
            window.addEventListener('keydown', handleMods);
            window.addEventListener('keypress', handleMods);
        }
    }

    function detachListeners()
    {
        if (!attached)
        {
            return;
        }
        attached = false;

        element.removeEventListener('mousemove', handleMouseMove);

        element.removeEventListener('mousedown', handleMouseDown);

        element.removeEventListener('mouseup', handleMouseUp);

        element.removeEventListener('mouseleave', clearState);
        element.removeEventListener('mouseenter', clearState);
        element.removeEventListener('mouseout', clearState);
        element.removeEventListener('mouseover', clearState);

        element.removeEventListener('blur', handleBlur);

        element.removeEventListener('keyup', handleMods);
        element.removeEventListener('keydown', handleMods);
        element.removeEventListener('keypress', handleMods);

        if (element !== window)
        {
            window.removeEventListener('blur', handleBlur);

            window.removeEventListener('keyup', handleMods);
            window.removeEventListener('keydown', handleMods);
            window.removeEventListener('keypress', handleMods);
        }
    }

    // Attach listeners
    attachListeners();

    const result: {
        x: number, y: number, element: any,
        buttons: any
    } = {
        element
    } as any;

    Object.defineProperties(result, {
        enabled: {
            get() { return attached; },
            set(f)
            {
                if (f)
                {
                    attachListeners();
                }
                else
                {
                    detachListeners();
                }
            },
            enumerable: true
        },
        buttons: {
            get() { return buttonState; },
            enumerable: true
        },
        x: {
            get() { return x; },
            enumerable: true
        },
        y: {
            get() { return y; },
            enumerable: true
        },
        mods: {
            get() { return mods; },
            enumerable: true
        }
    });

    return result;
}
