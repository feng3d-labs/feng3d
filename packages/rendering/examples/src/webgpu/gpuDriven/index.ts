/**
 * GPU Driven Rendering - Simple Cube
 *
 * 演示 @feng3d/rendering 的 GPU 驱动渲染系统
 */

import { GPUDrivenRenderer } from '@feng3d/rendering';
import type { Camera, ObjectData, Material } from '@feng3d/rendering';
import { WebGPU, type RenderPipeline, type RenderPassColorAttachment, type RenderPassDepthStencilAttachment } from '@feng3d/webgpu';
import { mat4, vec3 } from 'wgpu-matrix';

// 立方体顶点数据
const cubeVertices = new Float32Array([
    // 前面
    -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
    // 后面
    -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, -1,
    // 上面
    -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1,
    // 下面
    -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,
    // 右面
    1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,
    // 左面
    -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1,
]);

// 立方体索引数据
const cubeIndices = new Uint16Array([
    0, 1, 2, 0, 2, 3,   // 前面
    4, 5, 6, 4, 6, 7,   // 后面
    8, 9, 10, 8, 10, 11, // 上面
    12, 13, 14, 12, 14, 15, // 下面
    16, 17, 18, 16, 18, 19, // 右面
    20, 21, 22, 20, 22, 23, // 左面
]);

// 顶点着色器 - 简化版本，使用 uniform 而不是 storage buffer
const vertexShader = `
struct Uniforms {
    modelViewProjectionMatrix: mat4x4<f32>,
};

@binding(0) @group(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
};

@vertex
fn main(@location(0) position: vec4<f32>) -> VertexOutput {
    var output: VertexOutput;
    output.position = uniforms.modelViewProjectionMatrix * position;
    output.color = vec4<f32>(0.5, 0.5, 0.5, 1.0);
    return output;
}
`;

// 片段着色器
const fragmentShader = `
@fragment
fn main(@location(0) color: vec4<f32>) -> @location(0) vec4<f32> {
    return color;
}
`;

async function main()
{
    const canvas = document.getElementById('webgpu') as HTMLCanvasElement;
    if (!canvas)
    {
        console.error('Canvas not found');
        return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    // 初始化 WebGPU
    const webgpu = await new WebGPU().init();

    // 创建 GPU 驱动渲染器
    const renderer = new GPUDrivenRenderer({
        maxObjects: 1000,
        maxMaterials: 16,
        debug: true,
    });

    // 创建渲染管线
    const pipeline: RenderPipeline = {
        vertex: { code: vertexShader },
        fragment: { code: fragmentShader },
        primitive: { cullFace: 'back' },
    };
    renderer.setRenderPipeline(pipeline);

    // 设置顶点数据
    renderer.setVertices({
        position: { data: cubeVertices, format: 'float32x3' as const, arrayStride: 12 },
    });

    // 设置索引数据
    renderer.setIndices(cubeIndices);

    // 创建材质数据
    const materials: Material[] = [
        { id: 0, data: { albedo: [1, 0.3, 0.3, 1] as const, metallic: 0, roughness: 0.5, normalScale: 1, occlusionStrength: 1, emissive: [0, 0, 0, 0] as const, type: 0 } },
        { id: 1, data: { albedo: [0.3, 1, 0.3, 1] as const, metallic: 0, roughness: 0.5, normalScale: 1, occlusionStrength: 1, emissive: [0, 0, 0, 0] as const, type: 0 } },
        { id: 2, data: { albedo: [0.3, 0.3, 1, 1] as const, metallic: 0, roughness: 0.5, normalScale: 1, occlusionStrength: 1, emissive: [0, 0, 0, 0] as const, type: 0 } },
    ];
    renderer.setMaterials(materials);

    // 相机参数
    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 100);

    // 物体位置
    const positions = [
        [-2, 0, 0],
        [0, 0, 0],
        [2, 0, 0],
    ];

    // 创建物体数据
    function createObjects(now: number): ObjectData[]
    {
        const objects: ObjectData[] = [];

        for (let i = 0; i < positions.length; i++)
        {
            const modelMatrix = mat4.create();
            mat4.translate(modelMatrix, vec3.fromValues(positions[i][0], positions[i][1], positions[i][2]), modelMatrix);
            mat4.rotate(modelMatrix, vec3.fromValues(0, 1, 0), now * (1 + i * 0.5), modelMatrix);

            objects.push({
                transform: {
                    modelMatrix: modelMatrix as Float32Array,
                    worldPosition: positions[i] as [number, number, number],
                    lodLevel: 0,
                },
                materialId: i,
                isTransparent: false,
                visible: true,
            });
        }

        return objects;
    }

    // 设置颜色附件
    const colorAttachment: RenderPassColorAttachment = {
        view: { texture: { context: { canvasId: 'webgpu' } } },
    };

    // 设置深度模板附件
    // view 为空时将自动从颜色附件中获取尺寸来创建深度纹理
    const depthStencilAttachment: RenderPassDepthStencilAttachment = {
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        depthClearValue: 1,
    };

    renderer.setColorAttachment(colorAttachment);
    renderer.setDepthStencilAttachment(depthStencilAttachment);

    // 设置相机
    const viewMatrix = mat4.create();
    mat4.translate(viewMatrix, vec3.fromValues(0, 0, -6), viewMatrix);
    const viewProjectionMatrix = mat4.create();
    mat4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix);

    const camera: Camera = {
        data: {
            viewMatrix: viewMatrix as Float32Array,
            projectionMatrix: projectionMatrix as Float32Array,
        },
        frustum: {
            planes: [
                [1, 0, 0, 1],
                [-1, 0, 0, 1],
                [0, 1, 0, 1],
                [0, -1, 0, 1],
                [0, 0, 1, 1],
                [0, 0, -1, 100],
            ],
        },
        objectCount: 3,
    };
    renderer.setCamera(camera);

    // 设置绑定资源（modelViewProjectionMatrix）- 使用第一个物体的 MVP 矩阵进行测试
    const modelViewProjectionMatrix = mat4.create();
    renderer.setBindingResources({
        uniforms: {
            value: {
                modelViewProjectionMatrix: viewProjectionMatrix,
            },
        },
    });

    // 动画循环
    let startTime = Date.now();

    function frame()
    {
        const now = (Date.now() - startTime) / 1000;
        const objects = createObjects(now);
        renderer.setObjects(objects);

        const submit = renderer.submit.value;
        webgpu.submit(submit);

        requestAnimationFrame(frame);
    }

    frame();
}

main();
