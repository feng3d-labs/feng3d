import { RenderPass, RenderPassDescriptor, RenderPipeline, Sampler, Submit, Texture, VertexAttributes } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';

// 导入手动编写的 WGSL 文件（调试用）
import drawBufferVertexWgsl from './shaders/vertex-draw-buffer.wgsl';
import drawBufferFragmentWgsl from './shaders/fragment-draw-buffer.wgsl';
import drawVertexWgsl from './shaders/vertex-draw.wgsl';
import drawFragmentWgsl from './shaders/fragment-draw.wgsl';

// 导入 TSL 生成的着色器
import { drawBufferVertexShader, drawBufferFragmentShader, drawVertexShader, drawFragmentShader } from './shaders/shader';

// 辅助函数：初始化画布大小
function initCanvasSize(canvas: HTMLCanvasElement)
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

document.addEventListener('DOMContentLoaded', async () =>
{
    // 生成 TSL 着色器代码（变量名与导入的相同，便于调试切换）
    const drawBufferVertexGlsl = drawBufferVertexShader.toGLSL(2);
    const drawBufferFragmentGlsl = drawBufferFragmentShader.toGLSL(2);
    // 使用 convertDepth: true 自动将深度从 WebGL 的 [-1, 1] 转换为 WebGPU 的 [0, 1]
    const drawBufferVertexWgsl = drawBufferVertexShader.toWGSL({ convertDepth: true });
    const drawBufferFragmentWgsl = drawBufferFragmentShader.toWGSL(drawBufferVertexShader);

    const drawVertexGlsl = drawVertexShader.toGLSL(2);
    const drawFragmentGlsl = drawFragmentShader.toGLSL(2);
    const drawVertexWgsl = drawVertexShader.toWGSL();
    const drawFragmentWgsl = drawFragmentShader.toWGSL(drawVertexShader);

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    initCanvasSize(canvas);
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 窗口大小
    const windowSize = {
        x: canvas.width,
        y: canvas.height,
    };

    // -- 初始化渲染管线 --

    // Draw Buffer 着色器（渲染到多个颜色附件）
    const drawBufferProgram: RenderPipeline = {
        vertex: { wgsl: drawBufferVertexWgsl },
        fragment: { wgsl: drawBufferFragmentWgsl },
        primitive: { topology: 'triangle-list' },
    };

    // Draw 着色器（混合纹理并渲染到屏幕）
    const drawProgram: RenderPipeline = {
        vertex: { wgsl: drawVertexWgsl },
        fragment: { wgsl: drawFragmentWgsl },
        primitive: { topology: 'triangle-list' },
    };

    // -- 初始化顶点数据 --

    // 三角形顶点（用于 Pass 1）
    const triPositions = new Float32Array([
        -0.5, -0.5, -1.0,
        0.5, -0.5, -1.0,
        0.0, 0.5, 1.0,
    ]);

    // 全屏四边形顶点（用于 Pass 2）
    const quadPositions = new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        1.0, 1.0,
        1.0, 1.0,
        -1.0, 1.0,
        -1.0, -1.0,
    ]);

    const quadTexcoords = new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
    ]);

    // -- 初始化顶点数组 --

    const triVertexArray: VertexAttributes = {
        position: { data: triPositions, format: 'float32x3' },
    };

    const quadVertexArray: VertexAttributes = {
        position: { data: quadPositions, format: 'float32x2' },
        textureCoordinates: { data: quadTexcoords, format: 'float32x2' },
    };

    // -- 初始化纹理 --

    const color1Texture: Texture = {
        descriptor: {
            format: 'rgba8unorm',
            size: [windowSize.x, windowSize.y],
        },
    };
    const color1Sampler: Sampler = {
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        minFilter: 'nearest',
        magFilter: 'nearest',
    };

    const color2Texture: Texture = {
        descriptor: {
            format: 'rgba8unorm',
            size: [windowSize.x, windowSize.y],
        },
    };
    const color2Sampler: Sampler = {
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        minFilter: 'nearest',
        magFilter: 'nearest',
    };

    // -- 初始化帧缓冲区 --

    const frameBuffer: RenderPassDescriptor = {
        colorAttachments: [
            { view: { texture: color1Texture, baseMipLevel: 0 } },
            { view: { texture: color2Texture, baseMipLevel: 0 } },
        ],
    };

    // -- 创建渲染通道 --

    // Pass 1: 渲染三角形到两个颜色附件
    const renderPass1: RenderPass = {
        descriptor: frameBuffer,
        renderPassObjects: [{
            pipeline: drawBufferProgram,
            vertices: triVertexArray,
            draw: { __type__: 'DrawVertex', vertexCount: 3 },
        }],
    };

    // Pass 2: 混合纹理并渲染到屏幕
    const renderPass2: RenderPass = {
        descriptor: {
            colorAttachments: [{ clearValue: [0.0, 0.0, 0.0, 1.0], loadOp: 'clear' }],
        },
        renderPassObjects: [{
            pipeline: drawProgram,
            bindingResources: {
                color1Map: { texture: color1Texture, sampler: color1Sampler } as any,
                color2Map: { texture: color2Texture, sampler: color2Sampler } as any,
            },
            vertices: quadVertexArray,
            draw: { __type__: 'DrawVertex', vertexCount: 6 },
        }],
    };

    // -- 提交渲染命令 --

    const submit: Submit = {
        commandEncoders: [{ passEncoders: [renderPass1, renderPass2] }],
    };

    webgpu.submit(submit);
});
