import { fit } from './hughsk/canvas-fit';
import { attachCamera } from './hughsk/canvas-orbit-camera';
import { resl } from './mikolalysenko/resl';
import * as mat4 from './stackgl/gl-mat4';
import * as vec3 from './stackgl/gl-vec3';

import { gPartial } from '@feng3d/polyfill';
import { RenderAtomic, Texture, WebGLRenderer } from '../../../src';

const canvas = document.createElement('canvas');
canvas.id = 'glcanvas';
canvas.style.position = 'fixed';
canvas.style.left = '0px';
canvas.style.top = '0px';
canvas.style.width = '100%';
canvas.style.height = '100%';
document.body.appendChild(canvas);

const camera = attachCamera(canvas);
window.addEventListener('resize', fit(canvas), false);

// configure intial camera view.
camera.view(mat4.lookAt([], [0, 3.0, 30.0], [0, 0, -5.5], [0, 1, 0]));
camera.rotate([0.0, 0.0], [3.14 * 0.15, 0.0]);

const uv: number[][] = [];
const elements: number[][] = [];
const position: number[][] = [];
const oldPosition: number[][] = [];
const normal: number[][] = [];
const constraints: Constraint[] = [];

// create a constraint between the vertices with the indices i0 and i1.
class Constraint
{
    i0: any;
    i1: any;
    restLength: number;
    constructor(i0, i1)
    {
        this.i0 = i0;
        this.i1 = i1;

        this.restLength = vec3.distance(position[i0], position[i1]);
    }
}

const size = 5.5;
const xmin = -size;
const xmax = Number(size);
const ymin = -size;
const ymax = Number(size);

// the tesselation level of the cloth.
const N = 20;

let row;
let col;

// create cloth vertices and uvs.
for (row = 0; row <= N; ++row)
{
    const z = (row / N) * (ymax - ymin) + ymin;
    const v = row / N;

    for (col = 0; col <= N; ++col)
    {
        const x = (col / N) * (xmax - xmin) + xmin;
        const u = col / N;

        position.push([x, 0.0, z]);
        oldPosition.push([x, 0.0, z]);
        uv.push([u, v]);
    }
}

let i; let i0; let i1; let i2; let
    i3;

// for every vertex, create a corresponding normal.
for (i = 0; i < position.length; ++i)
{
    normal.push([0.0, 0.0, 0.0]);
}

// create faces
for (row = 0; row <= (N - 1); ++row)
{
    for (col = 0; col <= (N - 1); ++col)
    {
        i = row * (N + 1) + col;

        i0 = i + 0;
        i1 = i + 1;
        i2 = i + (N + 1) + 0;
        i3 = i + (N + 1) + 1;

        elements.push([i3, i1, i0]);
        elements.push([i0, i2, i3]);
    }
}

// create constraints
for (row = 0; row <= N; ++row)
{
    for (col = 0; col <= N; ++col)
    {
        i = row * (N + 1) + col;

        i0 = i + 0;
        i1 = i + 1;
        i2 = i + (N + 1) + 0;
        i3 = i + (N + 1) + 1;

        // add constraint linked to the element in the next column, if it exist.
        if (col < N)
        {
            constraints.push(new Constraint(i0, i1));
        }

        // add constraint linked to the element in the next row, if it exists
        if (row < N)
        {
            constraints.push(new Constraint(i0, i2));
        }

        // add constraint linked the next diagonal element, if it exists.
        if (col < N && row < N)
        {
            constraints.push(new Constraint(i0, i3));
        }
    }
}

const positions = position.reduce((pv: number[], cv: number[]) =>
{
    cv.forEach((v) => { pv.push(v); });

    return pv;
}, []);

const uvs = uv.reduce((pv: number[], cv: number[]) =>
{
    cv.forEach((v) => { pv.push(v); });

    return pv;
}, []);

const normals = normal.reduce((pv: number[], cv: number[]) =>
{
    cv.forEach((v) => { pv.push(v); });

    return pv;
}, []);

const indices = elements.reduce((pv: number[], cv: number[]) =>
{
    cv.forEach((v) => { pv.push(v); });

    return pv;
}, []);

const webglRenderer = new WebGLRenderer({ canvas });

let diffuse: gPartial<Texture<any>>;

let tick = 0;
let viewportWidth = 1;
let viewportHeight = 1;

const renderAtomic = new RenderAtomic({
    attributes: {
        position: { array: positions, itemSize: 3 },
        normal: { array: normals, itemSize: 3 },
        uv: { array: uvs, itemSize: 2 },
    },
    index: { array: indices },
    uniforms: {
        view: () => camera.view(),
        projection: () =>
            mat4.perspective([],
                Math.PI / 4,
                viewportWidth / viewportHeight,
                0.01,
                1000),
        texture: () => diffuse,
    },
    renderParams: { cullFace: 'NONE', enableBlend: true },
    shader: {
        vertex: `precision mediump float;

        attribute vec3 position;
        attribute vec3 normal;
        attribute vec2 uv;
      
        varying vec2 vUv;
        varying vec3 vNormal;
      
        uniform mat4 projection, view;
      
        void main() {
          vUv = uv;
          vNormal = normal;
          gl_Position = projection * view * vec4(position, 1);
        }`,
        fragment: `precision mediump float;

        varying vec2 vUv;
        varying vec3 vNormal;
      
        uniform sampler2D texture;
      
        void main () {
          vec3 tex = texture2D(texture, vUv*1.0).xyz;
          vec3 lightDir = normalize(vec3(0.4, 0.9, 0.3));
      
          vec3 n = vNormal;
      
          // for the back faces we need to use the opposite normals.
          if(gl_FrontFacing == false) {
            n = -n;
          }
      
          vec3 ambient = 0.3 * tex;
          vec3 diffuse = 0.7 * tex * clamp( dot(n, lightDir ), 0.0, 1.0 );
      
          gl_FragColor = vec4(ambient + diffuse, 1.0);
        }` }
});

function draw()
{
    const deltaTime = 0.017;

    let vel: number[] = [];
    let next: number[] = [];
    const delta = deltaTime;

    const g = [0.0, -4.0, 0.0]; // gravity force vector.

    const windForce = [Math.sin(tick / 2.0), Math.cos(tick / 3.0), Math.sin(tick / 1.0)];
    vec3.normalize(windForce, windForce);
    vec3.scale(windForce, windForce, 20.6);

    for (i = 0; i < position.length; ++i)
    {
        //
        // we do verlet integration for every vertex.
        //

        // compute velocity.
        vec3.subtract(vel, position[i], oldPosition[i]);
        vel = [vel[0], vel[1], vel[2]];
        next = [position[i][0], position[i][1], position[i][2]];

        // advance vertex with velocity.
        vec3.add(next, next, vel);

        // apply gravity force.
        vec3.scaleAndAdd(next, next, g, delta * delta);

        // apply wind force.
        vec3.scaleAndAdd(next, next, windForce, delta * delta);

        // keep track of current and old position.
        oldPosition[i] = [position[i][0], position[i][1], position[i][2]];
        position[i] = [next[0], next[1], next[2]];
    }

    const d = [];
    let v0; let
        v1;
    //
    // Attempt to satisfy the constraints by running a couple of iterations.
    //
    for (i = 0; i < 15; ++i)
    {
        for (let j = 0; j < constraints.length; j++)
        {
            const c = constraints[j];

            v0 = position[c.i0];
            v1 = position[c.i1];

            vec3.subtract(d, v1, v0);

            const dLength = vec3.length(d);
            const diff = (dLength - c.restLength) / dLength;

            // repulse/attract the end vertices of the constraint.
            vec3.scaleAndAdd(v0, v0, d, +0.5 * diff);
            vec3.scaleAndAdd(v1, v1, d, -0.5 * diff);
        }
    }

    // we make some vertices at the edge of the cloth unmovable.
    for (i = 0; i <= N; ++i)
    {
        position[i] = [oldPosition[i][0], oldPosition[i][1], oldPosition[i][2]];
    }

    // next, we recompute the normals
    for (i = 0; i < normal.length; i++)
    {
        normal[i] = [0.0, 0.0, 0.0];
    }

    //
    for (i = 0; i < elements.length; i++)
    {
        i0 = elements[i][0];
        i1 = elements[i][1];
        i2 = elements[i][2];

        const p0 = position[i0];
        const p1 = position[i1];
        const p2 = position[i2];

        v0 = [0.0, 0.0, 0.0];
        vec3.subtract(v0, p0, p1);

        v1 = [0.0, 0.0, 0.0];
        vec3.subtract(v1, p0, p2);

        // compute face normal.
        const n0 = [0.0, 0.0, 0.0];
        vec3.cross(n0, v0, v1);
        vec3.normalize(n0, n0);

        // add face normal to vertices of face.
        vec3.add(normal[i0], normal[i0], n0);
        vec3.add(normal[i1], normal[i1], n0);
        vec3.add(normal[i2], normal[i2], n0);
    }

    // the average of the total face normals approximates the vertex normals.
    for (i = 0; i < normal.length; i++)
    {
        vec3.normalize(normal[i], normal[i]);
    }

    /*
      Make sure that we stream the positions and normals to their buffers,
      since these are updated every frame.
      */
    const positions = position.reduce((pv: number[], cv: number[]) =>
    {
        cv.forEach((v) => { pv.push(v); });

        return pv;
    }, []);
    const normals = normal.reduce((pv: number[], cv: number[]) =>
    {
        cv.forEach((v) => { pv.push(v); });

        return pv;
    }, []);

    renderAtomic.attributes.position.array = new Float32Array(positions);
    renderAtomic.attributes.normal.array = new Float32Array(normals);

    tick++;

    viewportWidth = canvas.width = canvas.clientWidth;
    viewportHeight = canvas.height = canvas.clientHeight;

    camera.tick();

    webglRenderer.render(renderAtomic);
    requestAnimationFrame(draw);
}

resl({
    manifest: {
        texture: {
            type: 'image',
            src: 'resources/assets/cloth.png',
        }
    },
    onDone: ({ texture }) =>
    {
        diffuse = {
            flipY: false,
            textureType: 'TEXTURE_2D',
            format: 'RGBA',
            type: 'UNSIGNED_BYTE',
            magFilter: 'NEAREST',
            minFilter: 'LINEAR_MIPMAP_LINEAR',
            activePixels: texture as any,
            generateMipmap: true,
        };

        draw();
    }
});
