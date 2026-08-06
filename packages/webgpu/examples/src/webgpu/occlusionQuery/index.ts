import { reactive } from '@feng3d/reactivity';
import { OcclusionQuery, RenderObject, RenderPass, RenderPassDescriptor, RenderPipeline, Submit } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';
import { GUI } from 'dat.gui';
import { mat4 } from 'wgpu-matrix';

import solidColorLitWGSL from './solidColorLit.wgsl';

const info = document.querySelector('#info');

const init = async (canvas: HTMLCanvasElement, gui: GUI) =>
{
    const settings = {
        animate: true,
    };

    gui.add(settings, 'animate');

    const devicePixelRatio = window.devicePixelRatio;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init();

    const pipeline: RenderPipeline = {
        vertex: {
            code: solidColorLitWGSL,
        },
        fragment: {
            code: solidColorLitWGSL,
        },
        primitive: {
            topology: 'triangle-list',
            cullFace: 'back',
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
        },
    };

    // prettier-ignore
    const cubePositions = [
        { position: [-1, 0, 0], id: '🟥', color: [1, 0, 0, 1] },
        { position: [1, 0, 0], id: '🟨', color: [1, 1, 0, 1] },
        { position: [0, -1, 0], id: '🟩', color: [0, 0.5, 0, 1] },
        { position: [0, 1, 0], id: '🟧', color: [1, 0.6, 0, 1] },
        { position: [0, 0, -1], id: '🟦', color: [0, 0, 1, 1] },
        { position: [0, 0, 1], id: '🟪', color: [0.5, 0, 0.5, 1] },
    ];

    const objectInfos = cubePositions.map(({ position, id, color }) =>
    {
        return {
            id,
            position: position.map((v) => v * 10),
            uni: {
                value: {
                    color: color,
                    worldViewProjectionMatrix: mat4.create(),
                    worldMatrix: mat4.create(),
                },
            },
        };
    });

    // prettier-ignore
    const vertexData = new Float32Array([
        // position             normal
        1, 1, -1, 1, 0, 0,
        1, 1, 1, 1, 0, 0,
        1, -1, 1, 1, 0, 0,
        1, -1, -1, 1, 0, 0,
        -1, 1, 1, -1, 0, 0,
        -1, 1, -1, -1, 0, 0,
        -1, -1, -1, -1, 0, 0,
        -1, -1, 1, -1, 0, 0,
        -1, 1, 1, 0, 1, 0,
        1, 1, 1, 0, 1, 0,
        1, 1, -1, 0, 1, 0,
        -1, 1, -1, 0, 1, 0,
        -1, -1, -1, 0, -1, 0,
        1, -1, -1, 0, -1, 0,
        1, -1, 1, 0, -1, 0,
        -1, -1, 1, 0, -1, 0,
        1, 1, 1, 0, 0, 1,
        -1, 1, 1, 0, 0, 1,
        -1, -1, 1, 0, 0, 1,
        1, -1, 1, 0, 0, 1,
        -1, 1, -1, 0, 0, -1,
        1, 1, -1, 0, 0, -1,
        1, -1, -1, 0, 0, -1,
        -1, -1, -1, 0, 0, -1,
    ]);
    // prettier-ignore
    const indices = new Uint16Array([
        0, 1, 2, 0, 2, 3, // +x face
        4, 5, 6, 4, 6, 7, // -x face
        8, 9, 10, 8, 10, 11, // +y face
        12, 13, 14, 12, 14, 15, // -y face
        16, 17, 18, 16, 18, 19, // +z face
        20, 21, 22, 20, 22, 23, // -z face
    ]);

    const vertexBuf = vertexData;

    const renderPassDescriptor: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context: { canvasId: canvas.id } } },
                clearValue: [0.5, 0.5, 0.5, 1.0],
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
        depthStencilAttachment: {
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    const renderObject: RenderObject = {
        pipeline: pipeline,
        vertices: {
            position: { data: vertexBuf, offset: 0, arrayStride: 6 * 4, format: 'float32x3' },
            normal: { data: vertexBuf, offset: 12, arrayStride: 6 * 4, format: 'float32x3' },
        },
        indices,
        draw: { __type__: 'DrawIndexed', indexCount: indices.length },
        bindingResources: {
            uni: {
                bufferView: undefined,
            },
        },
    };

    const renderObjects: RenderObject[] = objectInfos.map((v) =>
    {
        const ro: RenderObject = {
            ...renderObject,
            bindingResources: v as any,
        };

        return ro;
    });

    const occlusionQueryObjects: OcclusionQuery[] = renderObjects.map((ro) =>
        ({ __type__: 'OcclusionQuery', renderObjects: [ro] }));

    const renderPass: RenderPass = {
        descriptor: renderPassDescriptor,
        renderPassObjects: occlusionQueryObjects,
        onOcclusionQuery(_occlusionQuerys, results)
        {
            const visible = objectInfos
                .filter((_, i) => results[i])
                .map(({ id }) => id)
                .join('');

            info.textContent = `visible: ${visible}`;
        },
    };

    const submit: Submit = {
        commandEncoders: [
            {
                passEncoders: [
                    renderPass,
                ],
            },
        ],
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const lerpV = (a: number[], b: number[], t: number) =>
        a.map((v, i) => lerp(v, b[i], t));
    const pingPongSine = (t: number) => Math.sin(t * Math.PI * 2) * 0.5 + 0.5;

    let time = 0;
    let then = 0;

    function render(now: number)
    {
        now *= 0.001; // convert to seconds
        const deltaTime = now - then;

        then = now;

        if (settings.animate)
        {
            time += deltaTime;
        }

        const projection = mat4.perspective(
            (30 * Math.PI) / 180,
            canvas.clientWidth / canvas.clientHeight,
            0.5,
            100,
        );

        const m = mat4.identity();

        mat4.rotateX(m, time, m);
        mat4.rotateY(m, time * 0.7, m);
        mat4.translate(m, lerpV([0, 0, 5], [0, 0, 40], pingPongSine(time * 0.2)), m);
        const view = mat4.inverse(m);
        const viewProjection = mat4.multiply(projection, view);

        objectInfos.forEach(
            (
                {
                    uni,
                    position,
                },
                i,
            ) =>
            {
                const world = mat4.translation(position);

                const worldInverseTranspose = mat4.create();

                mat4.transpose(mat4.inverse(world), worldInverseTranspose);

                const worldViewProjection = mat4.create();

                mat4.multiply(viewProjection, world, worldViewProjection);

                reactive(uni.value).worldViewProjectionMatrix = worldViewProjection;
                reactive(uni.value).worldMatrix = worldInverseTranspose;
            },
        );

        webgpu.submit(submit);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
};

const panel = new GUI({ width: 310 });
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas, panel);
