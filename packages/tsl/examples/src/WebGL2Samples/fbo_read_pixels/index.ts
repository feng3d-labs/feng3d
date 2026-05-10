import { RenderObject, RenderPass, RenderPassDescriptor, RenderPassObject, RenderPipeline, Sampler, Submit, Texture } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';

// 导入手动编写的 WGSL 文件（因为 TSL 当前不支持多个输出和纹理数组）
import layerVertexWgsl from './shaders/vertex-layer.wgsl';
import layerFragmentWgsl from './shaders/fragment-layer.wgsl';
import multipleOutputVertexWgsl from './shaders/vertex-multiple-output.wgsl';
import multipleOutputFragmentWgsl from './shaders/fragment-multiple-output.wgsl';

// 导入 TSL 生成的着色器（用于参考和未来扩展）
import { layerVertexShader, layerFragmentShader, multipleOutputVertexShader, multipleOutputFragmentShader } from './shaders/shader';

document.addEventListener('DOMContentLoaded', async () =>
{
    // 生成 TSL 着色器代码（用于参考）
    // 注意：当前 TSL 不支持多个输出和纹理数组，所以使用手动编写的 GLSL/WGSL
    const layerVertexGlsl = layerVertexShader.toGLSL(2);
    const layerFragmentGlsl = layerFragmentShader.toGLSL(2);
    const layerVertexWgsl = layerVertexShader.toWGSL();
    const layerFragmentWgsl = layerFragmentShader.toWGSL(layerVertexShader);

    const multipleOutputVertexGlsl = multipleOutputVertexShader.toGLSL(2);
    const multipleOutputFragmentGlsl = multipleOutputFragmentShader.toGLSL(2);
    const multipleOutputVertexWgsl = multipleOutputVertexShader.toWGSL();
    const multipleOutputFragmentWgsl = multipleOutputFragmentShader.toWGSL(multipleOutputVertexShader);

    const devicePixelRatio = window.devicePixelRatio || 1;

    // 初始化 WebGPU
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const webgpu = await new WebGPU({ canvasId: 'canvas' }).init();

    // 窗口大小
    const windowSize = {
        x: canvas.width,
        y: canvas.height,
    };

    // 纹理索引
    const Textures = {
        RED: 0,
        GREEN: 1,
        BLUE: 2,
        MAX: 3,
    };

    // 视口划分
    const viewport: { x: number, y: number, z: number, w: number }[] = new Array(Textures.MAX);

    viewport[Textures.RED] = {
        x: windowSize.x / 2,
        y: 0,
        z: windowSize.x / 2,
        w: windowSize.y / 2,
    };

    viewport[Textures.GREEN] = {
        x: windowSize.x / 2,
        y: windowSize.y / 2,
        z: windowSize.x / 2,
        w: windowSize.y / 2,
    };

    viewport[Textures.BLUE] = {
        x: 0,
        y: windowSize.y / 2,
        z: windowSize.x / 2,
        w: windowSize.y / 2,
    };

    // 初始化缓冲区
    const positions = new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        1.0, 1.0,
        1.0, 1.0,
        -1.0, 1.0,
        -1.0, -1.0,
    ]);

    const texcoords = new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
    ]);

    // 初始化顶点数组
    const multipleOutputVertexArray = {
        vertices: {
            position: { data: positions, format: 'float32x2' as const },
        },
    };

    const layerVertexArray = {
        vertices: {
            position: { data: positions, format: 'float32x2' as const },
            textureCoordinates: { data: texcoords, format: 'float32x2' as const },
        },
    };

    // 初始化纹理
    const w = 16;
    const h = 16;

    const texture: Texture = {
        descriptor: {
            size: [w, h, 3],
            dimension: '2d-array',
            format: 'rgba8unorm',
        },
    };
    const sampler: Sampler = { minFilter: 'nearest', magFilter: 'nearest', lodMinClamp: 0, lodMaxClamp: 0 };

    // 初始化帧缓冲区
    // 注意：WebGPU 要求每个颜色附件的纹理视图只能包含一个层
    // arrayLayerCount 默认值为 1，可以省略显式设置
    const frameBuffer: RenderPassDescriptor = {
        colorAttachments: [
            { view: { texture, baseMipLevel: 0, baseArrayLayer: Textures.RED } },
            { view: { texture, baseMipLevel: 0, baseArrayLayer: Textures.GREEN } },
            { view: { texture, baseMipLevel: 0, baseArrayLayer: Textures.BLUE } },
        ],
    };

    // MVP 矩阵
    const matrix = new Float32Array([
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0,
    ]);

    // 渲染通道 1：渲染到纹理数组
    // 注意：当前 TSL 不支持多个输出，这里使用单个输出作为占位
    // 实际使用时需要扩展 TSL 以支持多个颜色附件
    const multipleOutputProgram: RenderPipeline = {
        vertex: { wgsl: multipleOutputVertexWgsl },
        fragment: { wgsl: multipleOutputFragmentWgsl },
        primitive: { topology: 'triangle-list' },
    };

    const renderPass1: RenderPass = {
        descriptor: frameBuffer,
        renderPassObjects: [
            {
                viewport: { x: 0, y: 0, width: w, height: h },
                pipeline: multipleOutputProgram,
                bindingResources: { mvp: { value: matrix } },
                vertices: multipleOutputVertexArray.vertices,
                draw: { __type__: 'DrawVertex', vertexCount: 6 },
            }],
    };

    // 渲染通道 2：从纹理数组读取并渲染到屏幕
    const layerProgram: RenderPipeline = {
        vertex: { wgsl: layerVertexWgsl },
        fragment: { wgsl: layerFragmentWgsl },
        primitive: { topology: 'triangle-list' },
    };

    const renderObjects: RenderPassObject[] = [];
    const renderPass: RenderPass = {
        descriptor: {
            colorAttachments: [{ clearValue: [0.0, 0.0, 0.0, 1.0], loadOp: 'clear' }],
        },
        renderPassObjects: renderObjects,
    };

    const renderObject: RenderObject = {
        pipeline: layerProgram,
        bindingResources: { mvp: { value: matrix }, diffuse: { texture, sampler } as any },
        vertices: layerVertexArray.vertices,
        draw: { __type__: 'DrawVertex', vertexCount: 6 },
    };

    // 为每个纹理层创建渲染对象
    for (let i = 0; i < Textures.MAX; ++i)
    {
        renderObjects.push(
            {
                viewport: { x: viewport[i].x, y: viewport[i].y, width: viewport[i].z, height: viewport[i].w },
                ...renderObject,
                bindingResources: { ...renderObject.bindingResources, layer: { value: i } },
                draw: { __type__: 'DrawVertex', vertexCount: 6 },
            },
        );
    }

    const submit: Submit = {
        commandEncoders: [{ passEncoders: [renderPass1, renderPass] }],
    };

    // 渲染
    webgpu.submit(submit);

    // 使用 readPixels 从帧缓冲区读取像素数据
    // 通过 textureView 指定要读取的纹理视图（支持从纹理数组的特定层读取）
    const data = new Uint8Array(w * h * 4 * 3);

    console.log('=== readPixels 结果 ===');

    // 读取红色层
    let result = await webgpu.readPixels({
        textureView: frameBuffer.colorAttachments![0].view,
        origin: [0, 0],
        copySize: [w, h],
    });
    data.set(new Uint8Array(result.buffer), 0);
    console.log('红色层像素数据 (前16个字节):', Array.from(data.slice(0, 16)));

    // 读取绿色层
    result = await webgpu.readPixels({
        textureView: frameBuffer.colorAttachments![1].view,
        origin: [0, 0],
        copySize: [w, h],
    });
    data.set(new Uint8Array(result.buffer), w * h * 4);
    console.log('绿色层像素数据 (前16个字节):', Array.from(data.slice(w * h * 4, w * h * 4 + 16)));

    // 读取蓝色层
    result = await webgpu.readPixels({
        textureView: frameBuffer.colorAttachments![2].view,
        origin: [0, 0],
        copySize: [w, h],
    });
    data.set(new Uint8Array(result.buffer), w * h * 4 * 2);
    console.log('蓝色层像素数据 (前16个字节):', Array.from(data.slice(w * h * 4 * 2, w * h * 4 * 2 + 16)));

    console.log('完整像素数据大小:', data.length, '字节');
});
