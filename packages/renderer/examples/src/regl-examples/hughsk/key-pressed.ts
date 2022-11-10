import { output as keys } from './vkey';
const list = Object.keys(keys);
const down = {};

reset();

window.addEventListener('keydown', keydown, false);
window.addEventListener('keyup', keyup, false);
window.addEventListener('blur', reset, false);

export function pressed(key)
{
    return key
        ? down[key]
        : down;
}

function reset()
{
    list.forEach(function (code)
    {
        down[keys[code]] = false;
    });
}

function keyup(e)
{
    down[keys[e.keyCode]] = false;
}

function keydown(e)
{
    down[keys[e.keyCode]] = true;
}
