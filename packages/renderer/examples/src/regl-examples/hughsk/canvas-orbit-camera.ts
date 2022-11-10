import { createOrbitCamera as createCamera } from '../mikolalysenko/orbit-camera';
import { pressed as key } from './key-pressed';
import { attach as mp } from './mouse-position';
import { pressed as mb } from './mouse-pressed';
import { getScroller as createScroll } from './scroll-speed';

const panSpeed = 1;

export function attachCamera(canvas, opts?)
{
    opts = opts || {};
    opts.pan = opts.pan !== false;
    opts.scale = opts.scale !== false;
    opts.rotate = opts.rotate !== false;

    const scroll = createScroll(canvas, opts.scale);
    const mbut = mb(canvas, opts.rotate);
    const mpos = mp(canvas);
    const camera = createCamera(
        [0, 10, 30]
        , [0, 0, 0]
        , [0, 1, 0]
    );

    camera.tick = tick;

    return camera;

    function tick()
    {
        const ctrl = key('<control>') || key('<alt>');
        const alt = key('<shift>');
        const height = canvas.height;
        const width = canvas.width;

        if (opts.rotate && mbut.left && !ctrl && !alt)
        {
            camera.rotate(
                [mpos[0] / width - 0.5, mpos[1] / height - 0.5]
                , [mpos.prev[0] / width - 0.5, mpos.prev[1] / height - 0.5]
            );
        }

        if (opts.pan && mbut.right || (mbut.left && ctrl && !alt))
        {
            camera.pan([
                panSpeed * (mpos[0] - mpos.prev[0]) / width,
                panSpeed * (mpos[1] - mpos.prev[1]) / height
            ]);
        }

        if (opts.scale && scroll[1])
        {
            camera.distance *= Math.exp(scroll[1] / height);
        }

        if (opts.scale && (mbut.middle || (mbut.left && !ctrl && alt)))
        {
            const d = mpos.y - mpos.prevY;
            if (!d) return;

            camera.distance *= Math.exp(d / height);
        }

        scroll.flush();
        mpos.flush();
    }
}
