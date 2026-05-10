import { reactive } from '@feng3d/reactivity';
import { RenderObject, Submit } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';
import * as mat4 from './utils/gl-mat4';

import { vertexShader, fragmentShader } from './shaders/shader';

(async () =>
{
    // 使用 TSL 生成着色器代码
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    const devicePixelRatio = window.devicePixelRatio || 1;
    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    const cubePosition = [
        [-0.5, +0.5, +0.5], [+0.5, +0.5, +0.5], [+0.5, -0.5, +0.5], [-0.5, -0.5, +0.5], // positive z face.
        [+0.5, +0.5, +0.5], [+0.5, +0.5, -0.5], [+0.5, -0.5, -0.5], [+0.5, -0.5, +0.5], // positive x face
        [+0.5, +0.5, -0.5], [-0.5, +0.5, -0.5], [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5], // negative z face
        [-0.5, +0.5, -0.5], [-0.5, +0.5, +0.5], [-0.5, -0.5, +0.5], [-0.5, -0.5, -0.5], // negative x face.
        [-0.5, +0.5, -0.5], [+0.5, +0.5, -0.5], [+0.5, +0.5, +0.5], [-0.5, +0.5, +0.5], // top face
        [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5], [+0.5, -0.5, +0.5], [-0.5, -0.5, +0.5], // bottom face
    ];

    const cubeUv = [
        [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], // positive z face.
        [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], // positive x face.
        [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], // negative z face.
        [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], // negative x face.
        [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], // top face
        [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], // bottom face
    ];

    const cubeElements = [
        [2, 1, 0], [2, 0, 3], // positive z face.
        [6, 5, 4], [6, 4, 7], // positive x face.
        [10, 9, 8], [10, 8, 11], // negative z face.
        [14, 13, 12], [14, 12, 15], // negative x face.
        [18, 17, 16], [18, 16, 19], // top face.
        [20, 21, 22], [23, 20, 22], // bottom face
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

    let tick = 0;
    let viewportWidth = canvas.clientWidth * devicePixelRatio;
    let viewportHeight = canvas.clientHeight * devicePixelRatio;

    const renderObject: RenderObject = {
        vertices: {
            position: { data: new Float32Array(positions), format: 'float32x3' as const },
            uv: { data: new Float32Array(uvs), format: 'float32x2' as const },
        },
        indices: new Uint16Array(indices),
        draw: { __type__: 'DrawIndexed' as const, indexCount: indices.length },
        bindingResources: {},
        pipeline: {
            vertex: {
                wgsl: vertexWgsl,
            },
            fragment: {
                wgsl: fragmentWgsl,
            },
            depthStencil: { depthWriteEnabled: true },
        },
    };

    const submit: Submit = {
        commandEncoders: [{
            passEncoders: [
                {
                    descriptor: {
                        colorAttachments: [{ clearValue: [0, 0, 0, 1] }],
                        depthStencilAttachment: { depthClearValue: 1 },
                    },
                    renderPassObjects: [renderObject],
                },
            ],
        }],
    };

    let frameCount = 0;

    function draw()
    {
        tick++;

        const t = 0.01 * tick;
        reactive(renderObject.bindingResources).view = {
            value: mat4.lookAt([],
                [5 * Math.cos(t), 2.5 * Math.sin(t), 5 * Math.sin(t)],
                [0, 0.0, 0],
                [0, 1, 0]),
        };
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
    img.src = './peppers.png';
    await img.decode();

    const diffuse: {
        texture: {
            descriptor: {
                size: [number, number];
            };
            sources: [{ image: HTMLImageElement }];
        };
        sampler: {
            minFilter: string;
        };
    } = {
        texture: {
            descriptor: {
                size: [img.width, img.height],
            },
            sources: [{ image: img }],
        }, sampler: { minFilter: 'linear' },
    };
    reactive(renderObject.bindingResources).tex = diffuse;

    draw();
})();

