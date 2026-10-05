import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker } from 'feng3d';
import type { View } from 'feng3d';
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 摩擦对比示例（对应 cannon-es 的 `friction.html` / `simple_friction.html`）。
 *
 * 一个倾斜的地面 + 三个摩擦系数不同的方块（0.02 / 0.3 / 0.9），同时从斜面高处释放：
 * 摩擦小的滑得远、摩擦大的几乎立刻停住。
 *
 * 斜面靠给地面 Object3D 一个绕 Z 的旋转实现（rotation.z = 0.26，+X 侧升高），
 * 这正是「刚体旋转同步」那一条扩展带来的能力：地面的朝向会从 rotation 同步到刚体。
 * 三个方块沿 Z 轴错开放置，避免它们互相碰撞干扰对比。
 */
const SLOPE = 0.26;
const START_X = 7;

const BLOCKS = [
    { friction: 0.02, color: { r: 0.35, g: 0.55, b: 0.95 } },
    { friction: 0.3, color: { r: 0.35, g: 0.75, b: 0.40 } },
    { friction: 0.9, color: { r: 0.90, g: 0.45, b: 0.30 } },
];

const blocks = BLOCKS.map((block, i) => {
    // 方块贴着斜面放：斜面上的 (x, 0, 0) 绕 Z 转 SLOPE 后是 (x·cos, x·sin)
    const y = START_X * Math.sin(SLOPE) + 1.2;

    return {
        __type__: 'Object3D',
        name: 'Block-' + (i + 1),
        position: { x: START_X, y, z: (i - 1) * 2.4 },
        scale: { x: 1.4, y: 1.4, z: 1.4 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry' },
            material: {
                __type__: 'ColorMaterial',
                uniforms: {
                    u_diffuseInput: { __type__: 'Color4', r: block.color.r, g: block.color.g, b: block.color.b, a: 1 },
                },
            },
        }, {
            __type__: 'BoxCollider',
            width: 1.4,
            height: 1.4,
            depth: 1.4,
        }, {
            __type__: 'Rigidbody',
            mass: 1,
            friction: block.friction,
        }],
    };
});

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsFriction',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.09, g: 0.10, b: 0.13, a: 1 },
        }, {
            __type__: 'PhysicsWorld',
            gravity: { x: 0, y: -9.82, z: 0 },
            friction: 0.3,
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 10, z: 24 },
            rotation: { x: -0.42, y: 0, z: 0 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            __type__: 'Object3D',
            name: 'Slope',
            rotation: { x: 0, y: 0, z: SLOPE },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: {
                        u_diffuseInput: { __type__: 'Color4', r: 0.24, g: 0.27, b: 0.32, a: 1 },
                    },
                },
            }, {
                __type__: 'BoxCollider',
                width: 30,
                height: 1,
                depth: 14,
            }, {
                __type__: 'Rigidbody',
                mass: 0,
            }],
            scale: { x: 30, y: 1, z: 14 },
        }, ...blocks],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
