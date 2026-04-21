import { mat4, vec3 } from 'wgpu-matrix';

import { reactive } from '@feng3d/reactivity';
import { BufferBinding, RenderObject, RenderPassDescriptor, Submit } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';

import { cubePositionOffset, cubeUVOffset, cubeVertexArray, cubeVertexCount, cubeVertexSize } from '../../meshes/cube';

import basicVertWGSL from '../../shaders/basic.vert.wgsl';
import vertexPositionColorWGSL from '../../shaders/vertexPositionColor.frag.wgsl';

const init = async (canvas: HTMLCanvasElement) =>
{
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init();

    const renderPassDescriptor: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context: { canvasId: canvas.id } } },
                clearValue: [0.5, 0.5, 0.5, 1.0],
            },
        ],
        depthStencilAttachment: {
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    const matrixSize = 4 * 16; // 4x4 matrix
    const offset = 256; // uniformBindGroup offset must be 256-byte aligned
    const uniformBufferSize = offset + matrixSize;

    const uniformBuffer = new ArrayBuffer(uniformBufferSize);

    const uniforms = {
        bufferView: new Uint8Array(uniformBuffer, 0, matrixSize),
        value: { modelViewProjectionMatrix: null as Float32Array }, // 在帧循环中设置
    };

    const renderObject: RenderObject = {
        pipeline: {
            vertex: { code: basicVertWGSL }, fragment: { code: vertexPositionColorWGSL },
            primitive: {
                cullFace: 'back',
            },
        },
        bindingResources: {
            uniforms,
        },
        vertices: {
            position: { data: cubeVertexArray, format: 'float32x4', offset: cubePositionOffset, arrayStride: cubeVertexSize },
            uv: { data: cubeVertexArray, format: 'float32x2', offset: cubeUVOffset, arrayStride: cubeVertexSize },
        },
        draw: { __type__: 'DrawVertex', vertexCount: cubeVertexCount },
    };

    const uniforms1 = {
        bufferView: new Uint8Array(uniformBuffer, offset, matrixSize),
        value: { modelViewProjectionMatrix: null as Float32Array }, // 在帧循环中设置
    };

    const renderObject1: RenderObject = {
        ...renderObject,
        bindingResources: {
            uniforms: uniforms1,
        },
    };

    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.perspective(
        (2 * Math.PI) / 5,
        aspect,
        1,
        100.0,
    );

    const modelMatrix1 = mat4.translation(vec3.create(-2, 0, 0));
    const modelMatrix2 = mat4.translation(vec3.create(2, 0, 0));
    const modelViewProjectionMatrix1 = mat4.create() as Float32Array;
    const modelViewProjectionMatrix2 = mat4.create() as Float32Array;
    const viewMatrix = mat4.translation(vec3.fromValues(0, 0, -7));

    const tmpMat41 = mat4.create();
    const tmpMat42 = mat4.create();

    function updateTransformationMatrix()
    {
        const now = Date.now() / 1000;

        mat4.rotate(
            modelMatrix1,
            vec3.fromValues(Math.sin(now), Math.cos(now), 0),
            1,
            tmpMat41,
        );
        mat4.rotate(
            modelMatrix2,
            vec3.fromValues(Math.cos(now), Math.sin(now), 0),
            1,
            tmpMat42,
        );

        mat4.multiply(viewMatrix, tmpMat41, modelViewProjectionMatrix1);
        mat4.multiply(
            projectionMatrix,
            modelViewProjectionMatrix1,
            modelViewProjectionMatrix1,
        );
        mat4.multiply(viewMatrix, tmpMat42, modelViewProjectionMatrix2);
        mat4.multiply(
            projectionMatrix,
            modelViewProjectionMatrix2,
            modelViewProjectionMatrix2,
        );
    }

    const data: Submit = {
        commandEncoders: [
            {
                passEncoders: [
                    { descriptor: renderPassDescriptor, renderPassObjects: [renderObject, renderObject1] },
                ],
            },
        ],
    };

    function frame()
    {
        updateTransformationMatrix();

        // 使用 subarray 是因为赋值不同的对象才会触发数据改变重新上传数据到GPU
        reactive(uniforms.value).modelViewProjectionMatrix = modelViewProjectionMatrix1.subarray();
        reactive(uniforms1.value).modelViewProjectionMatrix = modelViewProjectionMatrix2.subarray();

        webgpu.submit(data);

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas);
