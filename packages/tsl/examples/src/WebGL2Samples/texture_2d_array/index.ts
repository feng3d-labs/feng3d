import { reactive } from '@feng3d/reactivity';
import { RenderObject, RenderPass, RenderPipeline, Sampler, Submit, Texture, VertexAttributes } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';

import { fragmentShader, vertexShader } from './shaders/shader';

// 辅助函数：加载图像
function loadImage(url: string, onload: (img: HTMLImageElement) => void): HTMLImageElement
{
    const img = new Image();
    img.onload = function ()
    {
        onload(img);
    };
    img.src = url;

    return img;
}

// 辅助函数：初始化画布尺寸
function initCanvasSize(canvas: HTMLCanvasElement): void
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

document.addEventListener('DOMContentLoaded', async () =>
{
    // TSL 生成着色器代码（变量名与导入的相同，便于调试切换）
    const vertexGlsl = vertexShader.toGLSL(2);
    const fragmentGlsl = fragmentShader.toGLSL(2);
    const vertexWgsl = vertexShader.toWGSL({ convertDepth: true });
    const fragmentWgsl = fragmentShader.toWGSL(vertexShader);

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    initCanvasSize(canvas);
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 加载图像
    loadImage('./images/di-animation-array.jpg', (image) =>
    {
        const NUM_IMAGES = 3;
        const IMAGE_SIZE = {
            width: 960,
            height: 540,
        };

        // 使用 canvas 获取图像的像素数据数组
        const canvas = document.createElement('canvas');
        canvas.width = IMAGE_SIZE.width;
        canvas.height = IMAGE_SIZE.height * NUM_IMAGES;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, IMAGE_SIZE.width, IMAGE_SIZE.height * NUM_IMAGES);
        const pixels = new Uint8Array(imageData.data.buffer);

        // 顶点数据
        const positions = new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            1.0, 1.0,
            1.0, 1.0,
            -1.0, 1.0,
            -1.0, -1.0,
        ]);

        const texCoords = new Float32Array([
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            1.0, 0.0,
            0.0, 0.0,
            0.0, 1.0,
        ]);

        // 顶点数组
        const vertexArray: { vertices?: VertexAttributes } = {
            vertices: {
                position: { data: positions, format: 'float32x2' },
                texcoord: { data: texCoords, format: 'float32x2' },
            },
        };

        // 创建 2D 纹理数组
        const texture: Texture = {
            descriptor: {
                size: [IMAGE_SIZE.width, IMAGE_SIZE.height, NUM_IMAGES],
                dimension: '2d-array',
                format: 'rgba8unorm',
            },
            sources: [{ __type__: 'TextureDataSource', size: [IMAGE_SIZE.width, IMAGE_SIZE.height, NUM_IMAGES], data: pixels }],
        };

        // 创建采样器
        const sampler: Sampler = {
            minFilter: 'linear',
            magFilter: 'linear',
        };

        // MVP 矩阵（单位矩阵）
        const matrix = new Float32Array([
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0,
        ]);

        // 渲染管线
        const program: RenderPipeline = {
            vertex: {
                wgsl: vertexWgsl,
            },
            fragment: {
                wgsl: fragmentWgsl,
            },
            primitive: { topology: 'triangle-list' },
        };

        // 渲染对象
        const ro: RenderObject = {
            pipeline: program,
            bindingResources: {
                MVP: { value: matrix },
                diffuse: { texture, sampler } as any,
                layer: { value: 0 },
            },
            vertices: vertexArray.vertices,
            draw: { __type__: 'DrawVertex', vertexCount: 6 },
        };

        // 渲染通道
        const rp: RenderPass = {
            descriptor: { colorAttachments: [{ clearValue: [1.0, 1.0, 1.0, 1.0], loadOp: 'clear' }] },
            renderPassObjects: [ro],
        };

        // 提交对象
        const submit: Submit = {
            commandEncoders: [{ passEncoders: [rp] }],
        };

        let frame = 0;

        (function render()
        {
            // 更新纹理层
            reactive(ro.bindingResources!).layer = { value: frame };

            // 执行渲染
            webgpu.submit(submit);

            // 切换到下一帧
            frame = (frame + 1) % NUM_IMAGES;

            // 每 200ms 切换一帧
            setTimeout(() =>
            {
                requestAnimationFrame(render);
            }, 200);
        })();
    });
});

