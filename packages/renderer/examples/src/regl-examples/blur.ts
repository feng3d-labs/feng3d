import { fit } from './hughsk/canvas-fit';
import { attachCamera } from './hughsk/canvas-orbit-camera';

import { $set } from '@feng3d/serialization';
import { RenderAtomic, WebGLRenderer } from '../../../src';

const canvas = document.createElement('canvas');
canvas.id = 'glcanvas';
canvas.style.position = 'fixed';
canvas.style.left = '0px';
canvas.style.top = '0px';
canvas.style.width = '100%';
canvas.style.height = '100%';
document.body.appendChild(canvas);

window.addEventListener('resize', fit(canvas), false);

const camera = attachCamera(canvas);

// increase and decrease the blur amount by modifying this value.
const FILTER_RADIUS = 1;

// configure intial camera view.
camera.rotate([0.0, 0.0], [0.0, -0.4]);
camera.zoom(300.0);

const webglRenderer = new WebGLRenderer(canvas);

let batchId = 0;
let tick = 0;
const offsets = [{ offset: [-1, -1] },
{ offset: [-1, 0] },
{ offset: [-1, 1] },
{ offset: [0, -1] },
{ offset: [0, 0] },
{ offset: [0, 1] },
{ offset: [1, -1] },
{ offset: [1, 0] },
{ offset: [1, 1] }];

const renderAtomic = $set(new RenderAtomic(), {
    attributes: {
        position: {
            array: [
                0.5, 0,
                0, 0.5,
                1, 1
            ], itemSize: 2
        },
    },
    uniforms: {
        color: () => [
            Math.sin(0.02 * ((0.1 + Math.sin(batchId)) * tick + 3.0 * batchId)),
            Math.cos(0.02 * (0.02 * tick + 0.1 * batchId)),
            Math.sin(0.02 * ((0.3 + Math.cos(2.0 * batchId)) * tick + 0.8 * batchId)),
            1],
        angle: () => 0.01 * tick,
        offset: () => offsets[batchId].offset,
    },
    renderParams: { cullFace: 'NONE', enableBlend: true },
    shader: {
        vertex: `precision mediump float;
        attribute vec2 position;
        uniform float angle;
        uniform vec2 offset;
        void main() {
          gl_Position = vec4(
            cos(angle) * position.x + sin(angle) * position.y + offset.x,
            -sin(angle) * position.x + cos(angle) * position.y + offset.y, 0, 1);
        }`,
        fragment: `precision mediump float;
        uniform vec4 color;
        void main() {
          gl_FragColor = color;
        }`,
    }
});

function draw()
{
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    tick++;
    for (let i = 0; i < offsets.length; i++)
    {
        batchId = i;
        webglRenderer.render(renderAtomic);
    }

    requestAnimationFrame(draw);
}
draw();
