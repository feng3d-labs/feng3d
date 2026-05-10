import { reactive } from '@feng3d/reactivity';
import { Buffer, RenderObject, Submit } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';

import { attachCamera } from './hughsk/canvas-orbit-camera';
import { fragmentShader, vertexShader } from './shaders/shader';
import * as mat4 from './stackgl/gl-mat4';
import * as vec3 from './stackgl/gl-vec3';

(async () =>
{
    const devicePixelRatio = window.devicePixelRatio || 1;

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 使用 TSL 生成着色器代码
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    const camera = attachCamera(canvas);

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

    let tick = 0;
    let viewportWidth = 1;
    let viewportHeight = 1;
    let frameCount = 0;

    const renderObject: RenderObject = {
        vertices: {
            position: { data: new Float32Array(positions), format: 'float32x3' },
            normal: { data: new Float32Array(normals), format: 'float32x3' },
            uv: { data: new Float32Array(uvs), format: 'float32x2' },
        },
        indices: new Uint16Array(indices),
        draw: { __type__: 'DrawIndexed', indexCount: indices.length },
        bindingResources: {},
        pipeline: {
            vertex: {
                wgsl: vertexWgsl,
            },
            fragment: {
                wgsl: fragmentWgsl,
                targets: [{ blend: {} }],
            },
            depthStencil: {},
        },
    };

    const submit: Submit = {
        commandEncoders: [{
            passEncoders: [
                {
                    descriptor: { colorAttachments: [{ clearValue: [0, 0, 0, 1] }] },
                    renderPassObjects: [renderObject],
                },
            ],
        }],
    };

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

        reactive(Buffer.getBuffer(renderObject.vertices.position.data.buffer)).writeBuffers = [{ data: new Float32Array(positions) }];
        reactive(Buffer.getBuffer(renderObject.vertices.normal.data.buffer)).writeBuffers = [{ data: new Float32Array(normals) }];

        tick++;

        camera.tick();

        reactive(renderObject.bindingResources).view = { value: camera.view() };
        reactive(renderObject.bindingResources).projection = {
            value: mat4.perspective([],
                Math.PI / 4,
                viewportWidth / viewportHeight,
                0.01,
                1000),
        };

        webgpu.submit(submit);

        requestAnimationFrame(draw);
    }

    const img = new Image();
    img.src = './assets/cloth.png';
    await img.decode();

    const diffuse: {
        texture: {
            descriptor: {
                size: [number, number];
                generateMipmap: boolean;
            };
            sources: [{ image: HTMLImageElement }];
        };
        sampler: {
            minFilter: string;
            mipmapFilter: string;
            addressModeU: string;
            addressModeV: string;
        };
    } = {
        texture: {
            descriptor: {
                size: [img.width, img.height],
                generateMipmap: true,
            },
            sources: [{ image: img }],
        }, sampler: { minFilter: 'linear', mipmapFilter: 'linear', addressModeU: 'repeat', addressModeV: 'repeat' },
    };
    reactive(renderObject.bindingResources).texture = diffuse;

    draw();
})();