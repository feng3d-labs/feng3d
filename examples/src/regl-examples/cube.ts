import { gPartial, RenderAtomic, Texture, WebGLRenderer } from '../../../src';
import { resl } from './mikolalysenko/resl';
import * as mat4 from './stackgl/gl-mat4';

const webglcanvas = document.createElement('canvas');
webglcanvas.id = 'glcanvas';
webglcanvas.style.position = 'fixed';
webglcanvas.style.left = '0px';
webglcanvas.style.top = '0px';
webglcanvas.style.width = '100%';
webglcanvas.style.height = '100%';
document.body.appendChild(webglcanvas);

const cubePosition = [
    [-0.5, +0.5, +0.5], [+0.5, +0.5, +0.5], [+0.5, -0.5, +0.5], [-0.5, -0.5, +0.5], // positive z face.
    [+0.5, +0.5, +0.5], [+0.5, +0.5, -0.5], [+0.5, -0.5, -0.5], [+0.5, -0.5, +0.5], // positive x face
    [+0.5, +0.5, -0.5], [-0.5, +0.5, -0.5], [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5], // negative z face
    [-0.5, +0.5, -0.5], [-0.5, +0.5, +0.5], [-0.5, -0.5, +0.5], [-0.5, -0.5, -0.5], // negative x face.
    [-0.5, +0.5, -0.5], [+0.5, +0.5, -0.5], [+0.5, +0.5, +0.5], [-0.5, +0.5, +0.5], // top face
    [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5], [+0.5, -0.5, +0.5], [-0.5, -0.5, +0.5] // bottom face
];

const cubeUv = [
    [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], // positive z face.
    [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], // positive x face.
    [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], // negative z face.
    [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], // negative x face.
    [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], // top face
    [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0] // bottom face
];

const cubeElements = [
    [2, 1, 0], [2, 0, 3], // positive z face.
    [6, 5, 4], [6, 4, 7], // positive x face.
    [10, 9, 8], [10, 8, 11], // negative z face.
    [14, 13, 12], [14, 12, 15], // negative x face.
    [18, 17, 16], [18, 16, 19], // top face.
    [20, 21, 22], [23, 20, 22] // bottom face
];

const positions = cubePosition.reduce((pv: number[], cv: number[]) =>
{
    cv.forEach((v) => { pv.push(v); });

    return pv;
}, []);

const uvs = cubeUv.reduce((pv: number[], cv: number[]) =>
{
    cv.forEach((v) => { pv.push(v); });

    return pv;
}, []);

const indices = cubeElements.reduce((pv: number[], cv: number[]) =>
{
    cv.forEach((v) => { pv.push(v); });

    return pv;
}, []);

const webglRenderer = new WebGLRenderer({ canvas: webglcanvas });

let diffuse: gPartial<Texture<any>>;

let tick = 0;
let viewportWidth = 1;
let viewportHeight = 1;

const renderAtomic = new RenderAtomic({
    attributes: {
        position: { array: positions, itemSize: 3 },
        uv: { array: uvs, itemSize: 2 },
    },
    index: { array: indices },
    uniforms: {
        view: () =>
        {
            const t = 0.01 * tick;

            return mat4.lookAt([],
                [5 * Math.cos(t), 2.5 * Math.sin(t), 5 * Math.sin(t)],
                [0, 0.0, 0],
                [0, 1, 0]);
        },
        projection: () =>
            mat4.perspective([],
                Math.PI / 4,
                viewportWidth / viewportHeight,
                0.01,
                10),
        tex: () => diffuse,
    },
    renderParams: { cullFace: 'NONE', enableBlend: true },
    shader: {
        vertex: `precision mediump float;
        attribute vec3 position;
        attribute vec2 uv;
        varying vec2 vUv;
        uniform mat4 projection, view;
        void main() {
          vUv = uv;
          gl_Position = projection * view * vec4(position, 1);
        }`,
        fragment: `precision mediump float;
        varying vec2 vUv;
        uniform sampler2D tex;
        void main () {
          gl_FragColor = texture2D(tex,vUv);
        }` }
});

function draw()
{
    tick++;

    viewportWidth = webglcanvas.width = webglcanvas.clientWidth;
    viewportHeight = webglcanvas.height = webglcanvas.clientHeight;

    webglRenderer.render(renderAtomic);
    requestAnimationFrame(draw);
}

resl({
    manifest: {
        texture: {
            type: 'image',
            src: 'resources/assets/peppers.png',
        }
    },
    onDone: ({ texture }) =>
    {
        diffuse = {
            flipY: false,
            textureType: 'TEXTURE_2D',
            format: 'RGBA',
            type: 'UNSIGNED_BYTE',
            magFilter: 'LINEAR',
            minFilter: 'LINEAR',
            activePixels: texture as any,
        };

        draw();
    }
});
