import { $set } from '@feng3d/serialization';
import { RenderAtomic, WebGLRenderer } from '../../../src';
import { angleNormals } from './mikolalysenko/angle-normals';
import * as bunny from './mikolalysenko/bunny';
import { createCamera } from './util/camera';

const webglcanvas = document.createElement('canvas');
webglcanvas.id = 'glcanvas';
webglcanvas.style.position = 'fixed';
webglcanvas.style.left = '0px';
webglcanvas.style.top = '0px';
webglcanvas.style.width = '100%';
webglcanvas.style.height = '100%';
document.body.appendChild(webglcanvas);

const webglRenderer = new WebGLRenderer(webglcanvas, { antialias: true });

const camera = createCamera({
    center: [0, 2.5, 0]
});

const positions = bunny.positions.reduce((pv: number[], cv: number[]) =>
{
    cv.forEach((v) => { pv.push(v); });

    return pv;
}, []);

const indices = bunny.cells.reduce((pv: number[], cv: number[]) =>
{
    cv.forEach((v) => { pv.push(v); });

    return pv;
}, []);

const normals = angleNormals(bunny.cells, bunny.positions).reduce((pv: number[], cv: number[]) =>
{
    cv.forEach((v) => { pv.push(v); });

    return pv;
}, []);

const renderAtomic = $set(new RenderAtomic(), {
    attributes: {
        position: { array: positions, itemSize: 3 },
        normal: { array: normals, itemSize: 3 },
    },
    index: { array: indices },
    uniforms: {},
    renderParams: { cullFace: 'NONE', enableBlend: true },
    shader: {
        vertex: `precision mediump float;
        uniform mat4 projection, view;
        attribute vec3 position, normal;
        varying vec3 vnormal;
        void main () {
          vnormal = normal;
          gl_Position = projection * view * vec4(position, 1.0);
        }`,
        fragment: `precision mediump float;
        varying vec3 vnormal;
        void main () {
          gl_FragColor = vec4(abs(vnormal), 1.0);
        }`,
    }
});

function draw()
{
    webglcanvas.width = webglcanvas.clientWidth;
    webglcanvas.height = webglcanvas.clientHeight;

    camera(renderAtomic, webglcanvas.width, webglcanvas.height);

    webglRenderer.render(renderAtomic);

    requestAnimationFrame(draw);
}
draw();
