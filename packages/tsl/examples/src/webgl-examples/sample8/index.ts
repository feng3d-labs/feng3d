import { RenderObject, RenderPass, RenderPassDescriptor, Sampler, Submit, Texture } from '@feng3d/render-api';
import { reactive } from '@feng3d/reactivity';
import { WebGPU } from '@feng3d/webgpu';
import { mat4 } from 'gl-matrix';

import { vertexShader, fragmentShader } from './shaders/shader';

let cubeRotation = 0.0;

document.addEventListener('DOMContentLoaded', async () =>
{
    // 使用 TSL 生成着色器代码
    const vertexWgsl = vertexShader.toWGSL();
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    const devicePixelRatio = window.devicePixelRatio || 1;

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const webgpu = await new WebGPU(
        { canvasId: 'canvas' },
    ).init();

    // 初始化缓冲区
    const buffers = initBuffers();

    // 初始化纹理
    const texture = initTexture();

    // 设置视频（视频文件应该在 packages/tsl/examples/resources/ 目录下）
    // 由于 vite.config.js 中设置了 publicDir: 'resources'，resources 目录会被复制到构建输出
    // 所以从 sample8 目录访问，路径应该是 ../../Firefox.mp4
    const video = await setupVideo('./Firefox.mp4');

    // 设置取消静音按钮
    const unmuteBtn = document.getElementById('unmuteBtn') as HTMLButtonElement;
    if (unmuteBtn)
    {
        unmuteBtn.addEventListener('click', () =>
        {
            video.muted = false;
            unmuteBtn.textContent = '🔊 已取消静音';
            unmuteBtn.disabled = true;
            // 尝试播放（如果还没有播放）
            video.play().catch((err) =>
            {
                console.warn('播放失败:', err);
            });
        });
    }

    // 创建渲染对象
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
            aVertexNormal: {
                format: 'float32x3',
                data: buffers.normal,
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

    const renderPass: RenderPass = {
        descriptor: {
            colorAttachments: [{
                clearValue: [0.0, 0.0, 0.0, 1.0],
                loadOp: 'clear',
            }],
            depthStencilAttachment: {
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        },
        renderPassObjects: [renderObject],
    };

    let then = 0;

    // 绘制场景
    function render(now: number)
    {
        now *= 0.001; // 转换为秒
        const deltaTime = now - then;
        then = now;

        // 如果视频可以复制到纹理，则更新纹理
        updateTexture(texture.texture, video);

        const { projectionMatrix, modelViewMatrix, normalMatrix } = drawScene(canvas, deltaTime);

        reactive(renderObject.bindingResources).uProjectionMatrix = { value: projectionMatrix as Float32Array };
        reactive(renderObject.bindingResources).uModelViewMatrix = { value: modelViewMatrix as Float32Array };
        reactive(renderObject.bindingResources).uNormalMatrix = { value: normalMatrix as Float32Array };

        const submit: Submit = {
            commandEncoders: [{
                passEncoders: [renderPass],
            }],
        };

        webgpu.submit(submit);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
});

async function setupVideo(url: string): Promise<HTMLVideoElement>
{
    const video = document.createElement('video');

    // 先静音自动播放（浏览器允许），用户可以通过按钮取消静音
    video.loop = true;
    video.autoplay = true;
    video.muted = true;
    video.src = url;

    // 等待视频播放
    await video.play().catch((error) =>
    {
        console.warn('自动播放失败，等待用户交互:', error);
        // 添加点击事件监听，用户点击后开始播放
        const startPlay = () =>
        {
            video.play().then(() =>
            {
                document.removeEventListener('click', startPlay);
                document.removeEventListener('touchstart', startPlay);
            }).catch((err) =>
            {
                console.warn('播放失败:', err);
            });
        };
        document.addEventListener('click', startPlay, { once: true });
        document.addEventListener('touchstart', startPlay, { once: true });
    });

    return video;
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

    // Set up the normals for the vertices, so that we can compute lighting.

    const vertexNormals = [
        // Front
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,

        // Back
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,

        // Top
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,

        // Bottom
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,

        // Right
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,

        // Left
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
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
        normal: new Float32Array(vertexNormals),
        textureCoord: new Float32Array(textureCoordinates),
        indices: new Uint16Array(indices),
    };
}

//
// Initialize a texture.
//
function initTexture(): { texture: Texture; sampler: Sampler }
{
    const texture: Texture = {
        descriptor: {
            size: [1, 1],
            format: 'rgba8unorm',
        },
        sources: [{ __type__: 'TextureDataSource', size: [1, 1], data: new Uint8Array([0, 0, 255, 255]) }],
    };
    const sampler: Sampler = { addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge', minFilter: 'linear' };

    return { texture, sampler };
}

//
// copy the video texture
//
function updateTexture(texture: Texture, video: HTMLVideoElement)
{
    // 修改纹理尺寸
    if (texture.descriptor.size[0] !== video.videoWidth || texture.descriptor.size[1] !== video.videoHeight)
    {
        reactive(texture.descriptor).size = [video.videoWidth, video.videoHeight];
    }

    reactive(texture).sources = [{ image: video }];
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

    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    // Update the rotation for the next draw

    cubeRotation += deltaTime;

    return { projectionMatrix, modelViewMatrix, normalMatrix };
}

