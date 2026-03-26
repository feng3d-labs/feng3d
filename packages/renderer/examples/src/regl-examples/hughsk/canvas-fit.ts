// @see https://github.com/hughsk/canvas-fit

import { getSize as size } from './element-size';

const scratch = new Float32Array(2);

export function fit(canvas, parent?, scale?)
{
    const isSVG = canvas.nodeName.toUpperCase() === 'SVG';

    canvas.style.position = canvas.style.position || 'absolute';
    canvas.style.top = 0;
    canvas.style.left = 0;

    resize.scale = parseFloat(scale || 1);
    resize.parent = parent;

    return resize();

    function resize()
    {
        const p = resize.parent || canvas.parentNode;
        let width: number;
        let height: number;
        if (typeof p === 'function')
        {
            const dims = p(scratch) || scratch;
            width = dims[0];
            height = dims[1];
        }
        else
            if (p && p !== document.body)
            {
                const psize = size(p);
                width = psize[0] | 0;
                height = psize[1] | 0;
            }
            else
            {
                width = window.innerWidth;
                height = window.innerHeight;
            }

        if (isSVG)
        {
            canvas.setAttribute('width', `${width * resize.scale}px`);
            canvas.setAttribute('height', `${height * resize.scale}px`);
        }
        else
        {
            canvas.width = width * resize.scale;
            canvas.height = height * resize.scale;
        }

        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        return resize;
    }
}
