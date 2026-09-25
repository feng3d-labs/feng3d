import { WebGPU } from '@feng3d/webgpu';
import { StandardMaterial, Scene, View, Object3D, logic, reactive } from 'feng3d';
import '@feng3d/addons';

/**
 * 移植自 three.js examples/webgl_buffergeometry_instancing.html。
 *
 * 原示例：用 InstancedMesh（GPU 实例化）渲染大量实例。
 *
 * feng3d 适配：feng3d 暂无 GPU InstancedMesh，改用声明式数组展开 N 个 Object3D
 * （CPU 端生成多个 mesh，共享同一 geometry + material）。每个实例随机位置/旋转/颜色。
 * 性能不如 GPU 实例化，但验证渲染管线对大量物体的支持。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const COUNT = 200;
const sharedMat: StandardMaterial = {
    __type__: 'StandardMaterial',
    uniforms: {
        u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        u_specular: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 },
        u_glossiness: 20, u_reflectivity: 0,
    },
};

// 声明式生成 N 个实例（球体网格阵列）
const instances: Object3D[] = [];
const GRID = Math.ceil(Math.sqrt(COUNT));
const SPACING = 2;
for (let i = 0; i < COUNT; i++)
{
    const ix = i % GRID;
    const iz = Math.floor(i / GRID);
    instances.push({
        __type__: 'Object3D',
        name: `instance_${i}`,
        position: {
            x: (ix - GRID / 2) * SPACING,
            y: Math.sin(i * 0.3) * 1,
            z: (iz - GRID / 2) * SPACING,
        },
        rotation: { x: i * 0.01, y: i * 0.02, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'IcosahedronGeometry', radius: 0.5, detail: 0 },
            material: {
                __type__: 'StandardMaterial',
                uniforms: {
                    u_diffuse: { __type__: 'Color4', r: 0.5 + Math.sin(i) * 0.3, g: 0.5 + Math.cos(i * 1.3) * 0.3, b: 0.5 + Math.sin(i * 0.7) * 0.3, a: 1 },
                    u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                    u_glossiness: 0, u_reflectivity: 0,
                },
            } as StandardMaterial,
        }],
    });
}

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.02, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 15, z: 25 },
                components: [
                    { __type__: 'PerspectiveCamera', fov: 50, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 200 },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } },
                ],
            },
            {
                __type__: 'Object3D',
                name: 'dirLight',
                position: { x: 1, y: 1, z: 1 },
                components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 3 }],
            },
            ...instances,
        ],
    },
};

const viewLogic = logic(view);

function animate(): void
{
    const t = Date.now() * 0.001;
    // 让实例波动
    for (let i = 0; i < instances.length; i++)
    {
        const ix = i % GRID;
        const iz = Math.floor(i / GRID);
        reactive(instances[i]).position = {
            x: (ix - GRID / 2) * SPACING,
            y: Math.sin(t + i * 0.3) * 1,
            z: (iz - GRID / 2) * SPACING,
        };
    }

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
