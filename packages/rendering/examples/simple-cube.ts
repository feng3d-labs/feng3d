/**
 * GPUDrivenRenderer 基础示例
 *
 * 演示如何使用 GPU 驱动渲染器渲染多个立方体
 */

import { GPUDrivenRenderer } from '@feng3d/rendering';
import type { Camera, ObjectData, Material } from '@feng3d/rendering';
import { WebGPU, type RenderPipeline, type RenderPassColorAttachment, type RenderPassDepthStencilAttachment } from '@feng3d/webgpu';
import { mat4, vec3 } from 'wgpu-matrix';

// 立方体顶点数据
const cubeVertices = new Float32Array([
    // 前面
    -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1,
    // 后面
    -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1, -1,
    // 上面
    -1,  1, -1, -1,  1,  1,  1,  1,  1,  1,  1, -1,
    // 下面
    -1, -1, -1,  1, -1, -1,  1, -1,  1, -1, -1,  1,
    // 右面
     1, -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,
    // 左面
    -1, -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1,
]);

// 立方体索引数据
const cubeIndices = new Uint16Array([
    // 前面
    0, 1, 2, 0, 2, 3,
    // 后面
    4, 5, 6, 4, 6, 7,
    // 上面
    8, 9, 10, 8, 10, 11,
    // 下面
    12, 13, 14, 12, 14, 15,
    // 右面
    16, 17, 18, 16, 18, 19,
    // 左面
    20, 21, 22, 20, 22, 23,
]);

// 简单的顶点着色器
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
fn main(
    @location(0) position: vec4<f32>,
) -> VertexOutput {
    var output: VertexOutput;
    output.position = uniforms.modelViewProjectionMatrix * position;
    output.color = vec4<f32>(0.5, 0.5, 0.5, 1.0);
    return output;
}
`;

// 简单的片段着色器
const fragmentShader = `
@fragment
fn main(
    @location(0) color: vec4<f32>,
) -> @location(0) vec4<f32> {
    return color;
}
`;

/**
 * 初始化示例
 */
export async function initSimpleCubeExample(canvas: HTMLCanvasElement)
{
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    // 初始化 WebGPU
    const webgpu = await new WebGPU().init();

    // 创建 GPU 驱动渲染器
    const renderer = new GPUDrivenRenderer(webgpu.device, {
        maxObjects: 1000,
        maxMaterials: 16,
        debug: true,
    });

    // 创建渲染管线
    const pipeline: RenderPipeline = {
        vertex: { code: vertexShader },
        fragment: { code: fragmentShader },
        primitive: {
            cullFace: 'back',
        },
    };

    // 设置渲染管线
    renderer.setRenderPipeline(pipeline);

    // 创建相机数据
    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 100.0);

    function updateCamera()
    {
        const viewMatrix = mat4.create();
        mat4.translate(viewMatrix, vec3.fromValues(0, 0, -6), viewMatrix);

        const viewProjectionMatrix = mat4.create();
        mat4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix);

        // 创建相机数据
        const camera: Camera = {
            data: {
                viewMatrix: viewMatrix as Float32Array,
                projectionMatrix: projectionMatrix as Float32Array,
            },
            frustum: {
                planes: [
                    [1, 0, 0, 1],   // left
                    [-1, 0, 0, 1],  // right
                    [0, 1, 0, 1],   // top
                    [0, -1, 0, 1],  // bottom
                    [0, 0, 1, 1],   // near
                    [0, 0, -1, 1],  // far
                ],
            },
            objectCount: 3,
        };

        renderer.setCamera(camera);
    }

    // 创建材质数据
    const materials: Material[] = [
        {
            id: 0,
            data: {
                albedo: [1, 0.3, 0.3, 1] as const,  // 红色
                metallic: 0.0,
                roughness: 0.5,
                normalScale: 1.0,
                occlusionStrength: 1.0,
                emissive: [0, 0, 0, 0] as const,
            },
        },
        {
            id: 1,
            data: {
                albedo: [0.3, 1, 0.3, 1] as const,  // 绿色
                metallic: 0.0,
                roughness: 0.5,
                normalScale: 1.0,
                occlusionStrength: 1.0,
                emissive: [0, 0, 0, 0] as const,
            },
        },
        {
            id: 2,
            data: {
                albedo: [0.3, 0.3, 1, 1] as const,  // 蓝色
                metallic: 0.0,
                roughness: 0.5,
                normalScale: 1.0,
                occlusionStrength: 1.0,
                emissive: [0, 0, 0, 0] as const,
            },
        },
    ];

    renderer.setMaterials(materials);

    // 创建物体数据
    function createObjects(): ObjectData[]
    {
        const objects: ObjectData[] = [];

        // 三个立方体，不同位置
        const positions = [
            [-2, 0, 0],
            [0, 0, 0],
            [2, 0, 0],
        ];

        for (let i = 0; i < positions.length; i++)
        {
            const modelMatrix = mat4.create();
            mat4.translate(modelMatrix, vec3.fromValues(positions[i][0], positions[i][1], positions[i][2]), modelMatrix);

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

    let objects = createObjects();
    renderer.setObjects(objects);

    // 设置颜色附件
    const colorAttachment: RenderPassColorAttachment = {
        view: { texture: { context: { canvasId: canvas.id } } },
    };

    // 设置深度模板附件
    const depthStencilAttachment: RenderPassDepthStencilAttachment = {
        view: { texture: { size: [canvas.width, canvas.height], format: 'depth24plus' } },
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        depthClearValue: 1.0,
    };

    renderer.setColorAttachment(colorAttachment);
    renderer.setDepthStencilAttachment(depthStencilAttachment);

    // 更新相机
    updateCamera();

    // 动画循环
    let startTime = Date.now();

    function frame()
    {
        const now = (Date.now() - startTime) / 1000;

        // 更新物体变换
        objects = createObjects();
        for (let i = 0; i < objects.length; i++)
        {
            const rotationSpeed = 1 + i * 0.5;
            mat4.rotate(
                objects[i].transform.modelMatrix as mat4.Mat4,
                vec3.fromValues(0, 1, 0),
                now * rotationSpeed,
                objects[i].transform.modelMatrix as mat4.Mat4,
            );
        }
        renderer.setObjects(objects);

        // 获取 Submit 并提交渲染
        const submit = renderer.submit.value;
        webgpu.submit(submit);

        requestAnimationFrame(frame);
    }

    frame();
}
