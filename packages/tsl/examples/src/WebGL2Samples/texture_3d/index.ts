import { reactive } from '@feng3d/reactivity';
import { RenderObject, RenderPass, RenderPipeline, Sampler, Submit, Texture, VertexAttributes } from '@feng3d/render-api';
import { WebGPU } from '@feng3d/webgpu';
import { snoise } from './third-party/noise3D';

// 导入 TSL 着色器
import { fragmentShader, vertexShader } from './shaders/shader';

// 辅助函数：初始化画布尺寸
function initCanvasSize(canvas: HTMLCanvasElement): void
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
}

// 辅助函数：计算 yaw-pitch-roll 旋转矩阵
function yawPitchRoll(yaw: number, pitch: number, roll: number): number[]
{
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    const cosRoll = Math.cos(roll);
    const sinRoll = Math.sin(roll);

    return [
        cosYaw * cosPitch,
        cosYaw * sinPitch * sinRoll - sinYaw * cosRoll,
        cosYaw * sinPitch * cosRoll + sinYaw * sinRoll,
        0.0,
        sinYaw * cosPitch,
        sinYaw * sinPitch * sinRoll + cosYaw * cosRoll,
        sinYaw * sinPitch * cosRoll - cosYaw * sinRoll,
        0.0,
        -sinPitch,
        cosPitch * sinRoll,
        cosPitch * cosRoll,
        0.0,
        0.0, 0.0, 0.0, 1.0,
    ];
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

    // 视口划分
    const windowSize = {
        x: canvas.width,
        y: canvas.height,
    };

    const Corners = {
        TOP_LEFT: 0,
        TOP_RIGHT: 1,
        BOTTOM_RIGHT: 2,
        BOTTOM_LEFT: 3,
        MAX: 4,
    };

    const viewport: { x: number, y: number, z: number, w: number }[] = new Array(Corners.MAX);

    viewport[Corners.BOTTOM_LEFT] = {
        x: 0,
        y: 0,
        z: windowSize.x / 2,
        w: windowSize.y / 2,
    };

    viewport[Corners.BOTTOM_RIGHT] = {
        x: windowSize.x / 2,
        y: 0,
        z: windowSize.x / 2,
        w: windowSize.y / 2,
    };

    viewport[Corners.TOP_RIGHT] = {
        x: windowSize.x / 2,
        y: windowSize.y / 2,
        z: windowSize.x / 2,
        w: windowSize.y / 2,
    };

    viewport[Corners.TOP_LEFT] = {
        x: 0,
        y: windowSize.y / 2,
        z: windowSize.x / 2,
        w: windowSize.y / 2,
    };

    // 初始化 3D 纹理数据（使用 simplex noise）
    const SIZE = 32;
    const data = new Uint8Array(SIZE * SIZE * SIZE);
    for (let k = 0; k < SIZE; ++k)
    {
        for (let j = 0; j < SIZE; ++j)
        {
            for (let i = 0; i < SIZE; ++i)
            {
                data[i + j * SIZE + k * SIZE * SIZE] = snoise([i, j, k]) * 256;
            }
        }
    }

    // 创建 3D 纹理
    const texture: Texture = {
        descriptor: {
            size: [SIZE, SIZE, SIZE],
            dimension: '3d',
            format: 'r8unorm',
            generateMipmap: true,
        },
        sources: [{ __type__: 'TextureDataSource', mipLevel: 0, size: [SIZE, SIZE, SIZE], data }],
    };

    // 创建采样器
    const sampler: Sampler = {
        lodMinClamp: 0,
        lodMaxClamp: Math.log2(SIZE),
        minFilter: 'linear',
        magFilter: 'linear',
        mipmapFilter: 'linear',
    };

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
            in_texcoord: { data: texCoords, format: 'float32x2' },
        },
    };

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

    // 基础渲染对象
    const ro: RenderObject = {
        pipeline: program,
        bindingResources: {
            diffuse: { texture, sampler } as any,
        },
        vertices: vertexArray.vertices,
        draw: { __type__: 'DrawVertex', vertexCount: 6 },
    };

    // 为每个视口创建渲染对象
    const renderPassObjects: RenderObject[] = [];
    for (let i = 0; i < Corners.MAX; ++i)
    {
        renderPassObjects.push({
            ...ro,
            viewport: { x: viewport[i].x, y: viewport[i].y, width: viewport[i].z, height: viewport[i].w },
        });
    }

    // 渲染通道
    const rp: RenderPass = {
        descriptor: { colorAttachments: [{ clearValue: [0.0, 0.0, 0.0, 1.0], loadOp: 'clear' }] },
        renderPassObjects,
    };

    // 提交对象
    const submit: Submit = {
        commandEncoders: [{ passEncoders: [rp] }],
    };

    // 旋转角度
    const orientation = [0.0, 0.0, 0.0];

    function render()
    {
        // 更新旋转角度
        orientation[0] += 0.020; // yaw
        orientation[1] += 0.010; // pitch
        orientation[2] += 0.005; // roll

        // 计算各个旋转矩阵
        const yawMatrix = new Float32Array(yawPitchRoll(orientation[0], 0.0, 0.0));
        const pitchMatrix = new Float32Array(yawPitchRoll(0.0, orientation[1], 0.0));
        const rollMatrix = new Float32Array(yawPitchRoll(0.0, 0.0, orientation[2]));
        const yawPitchRollMatrix = new Float32Array(yawPitchRoll(orientation[0], orientation[1], orientation[2]));
        const matrices = [yawMatrix, pitchMatrix, rollMatrix, yawPitchRollMatrix];

        // 更新每个视口的旋转矩阵
        for (let i = 0; i < Corners.MAX; ++i)
        {
            reactive(renderPassObjects[i].bindingResources!).orientation = { value: matrices[i] };
        }

        // 执行渲染
        webgpu.submit(submit);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
});

