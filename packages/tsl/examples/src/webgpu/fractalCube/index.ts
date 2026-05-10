import { reactive } from '@feng3d/reactivity';
import { RenderObject, RenderPassDescriptor, Sampler, Submit, Texture } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';
import { mat4 } from 'gl-matrix';

import { fragmentShader, vertexShader } from './shaders/shader';

let cubeRotation = 0.0;

main();

//
// Start here
//
async function main()
{
    // 使用 TSL 生成着色器代码
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    const devicePixelRatio = window.devicePixelRatio || 1;

    // 使用 WebGPU 首选画布格式，提升渲染性能，也可以指定纹理默认格式 'rgba8unorm'。下面拷贝纹理要求画布与纹理格式相同。
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const webgpu = await new WebGPU(
        { canvasId: 'canvas', configuration: { format: presentationFormat } },
    ).init();

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    const buffers = initBuffers();

    const texture: {
        texture: Texture;
        sampler: Sampler;
    } = { texture: { descriptor: { size: [canvas.width, canvas.height], format: presentationFormat } }, sampler: {} };

    const renderObject: RenderObject = {
        pipeline: {
            vertex: {
                wgsl: vertexWgsl,
            },
            fragment: {
                wgsl: fragmentWgsl,
            },
            primitive: { topology: 'triangle-list' },
            depthStencil: { depthCompare: 'less-equal' },
        },
        vertices: {
            aVertexPosition: {
                format: 'float32x3',
                data: buffers.position,
            },
            aTextureCoord: {
                format: 'float32x2',
                data: buffers.textureCoord,
            },
        },
        indices: buffers.indices,
        draw: { __type__: 'DrawIndexed', firstIndex: 0, indexCount: 36 },
        bindingResources: { uSampler: texture },
    };

    const renderPassDescriptor: RenderPassDescriptor = {
        colorAttachments: [{
            clearValue: [0.5, 0.5, 0.5, 1.0],
            loadOp: 'clear',
        }],
        depthStencilAttachment: {
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    const submit: Submit = {
        commandEncoders: [{
            passEncoders: [
                // 绘制
                {
                    descriptor: renderPassDescriptor,
                    renderPassObjects: [renderObject],
                },
                // 从画布中拷贝到纹理。
                {
                    __type__: 'CopyTextureToTexture',
                    source: { texture: null }, // 当值设置为 null或者undefined时表示当前画布。
                    destination: { texture: texture.texture },
                    copySize: [canvas.width, canvas.height],
                },
            ],
        }],
    };

    let then = 0;

    // Draw the scene repeatedly
    function render()
    {
        let now = Date.now();
        now *= 0.001; // convert to seconds
        const deltaTime = now - then;
        then = now;

        const { projectionMatrix, modelViewMatrix } = drawScene(canvas, deltaTime);

        reactive(renderObject.bindingResources).uProjectionMatrix = { value: projectionMatrix as Float32Array };
        reactive(renderObject.bindingResources).uModelViewMatrix = { value: modelViewMatrix as Float32Array };

        webgpu.submit(submit);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//
function initBuffers()
{
    // Now create an array of positions for the cube.

    const positions = [
        // Front face
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0,
    ];

    // Now set up the texture coordinates for the faces.

    const textureCoordinates = [
        // Front
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Back
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Top
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Bottom
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Right
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Left
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];

    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.

    const indices = [
        0, 1, 2, 0, 2, 3, // front
        4, 5, 6, 4, 6, 7, // back
        8, 9, 10, 8, 10, 11, // top
        12, 13, 14, 12, 14, 15, // bottom
        16, 17, 18, 16, 18, 19, // right
        20, 21, 22, 20, 22, 23, // left
    ];

    return {
        position: new Float32Array(positions),
        textureCoord: new Float32Array(textureCoordinates),
        indices: new Uint16Array(indices),
    };
}

//
// Draw the scene.
//
function drawScene(canvas: HTMLCanvasElement, deltaTime: number)
{
    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    const fieldOfView = 45 * Math.PI / 180; // in radians
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar);

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelViewMatrix = mat4.create();

    // Now move the drawing position a bit to where we want to
    // start drawing the square.

    mat4.translate(modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to translate
        [-0.0, 0.0, -6.0]); // amount to translate
    mat4.rotate(modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to rotate
        cubeRotation, // amount to rotate in radians
        [0, 0, 1]); // axis to rotate around (Z)
    mat4.rotate(modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to rotate
        cubeRotation * 0.7, // amount to rotate in radians
        [0, 1, 0]); // axis to rotate around (X)

    // Update the rotation for the next draw

    cubeRotation += deltaTime;

    return { projectionMatrix, modelViewMatrix };
}

