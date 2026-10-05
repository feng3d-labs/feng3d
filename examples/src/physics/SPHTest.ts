import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker } from 'feng3d';
import type { View } from 'feng3d';
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 光滑粒子流体示例（对应 cannon-es 的 `sph.html`）。
 *
 * 一柱「水」（4×4×3 = 48 个粒子）从空中落下、在容器里摊开。
 *
 * 接入方式：`SPHSystem` 组件只描述求解参数（密度 / 光滑半径 / 声速 / 粘性），
 * 每个粒子是一个挂 `SPHParticle` 的**普通对象**（带 MeshRenderer）——
 * 它**不要**再挂 Rigidbody / Collider，粒子刚体由 PhysicsWorld 按对象位置创建，
 * 每帧再把位置写回对象。所以场景数据里就是"一堆小球"，物理侧才知道它们是流体粒子。
 *
 * cannon-es 0.20 的 `World` 没有 `addSystem`，但 `step()` 会遍历 `world.subsystems` 逐个 `update()`，
 * 所以 PhysicsWorld 把求解器推进那个数组即可。
 */
const GRID = { x: 4, y: 4, z: 3 };
const SPACING = 0.75;
const PARTICLE_RADIUS = 0.3;

const particles = [];
for (let i = 0; i < GRID.x; i++)
{
    for (let j = 0; j < GRID.y; j++)
    {
        for (let k = 0; k < GRID.z; k++)
        {
            // 高度越高越偏青，越低越偏蓝，方便看清水流的方向
            const t = j / (GRID.y - 1);
            particles.push({
                __type__: 'Object3D',
                name: 'P-' + i + '-' + j + '-' + k,
                position: {
                    x: (i - (GRID.x - 1) / 2) * SPACING,
                    y: 5 + j * SPACING,
                    z: (k - (GRID.z - 1) / 2) * SPACING,
                },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SphereGeometry', radius: PARTICLE_RADIUS },
                    material: {
                        __type__: 'ColorMaterial',
                        uniforms: {
                            u_diffuseInput: {
                                __type__: 'Color4',
                                r: 0.25 + (1 - t) * 0.2,
                                g: 0.55 + (1 - t) * 0.25,
                                b: 0.95,
                                a: 1,
                            },
                        },
                    },
                }, {
                    __type__: 'SPHParticle',
                    mass: 1,
                    radius: PARTICLE_RADIUS,
                    linearDamping: 0.9,
                }],
            });
        }
    }
}

/** 容器：一块地板 + 四面矮墙，让水摊在里面而不是流走 */
function wall(name: string, x: number, z: number, width: number, depth: number)
{
    return {
        __type__: 'Object3D',
        name,
        position: { x, y: 1, z },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry' },
            material: {
                __type__: 'ColorMaterial',
                uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.20, g: 0.22, b: 0.26, a: 1 } },
            },
        }, { __type__: 'BoxCollider', width, height: 2, depth }, { __type__: 'Rigidbody', mass: 0 }],
        scale: { x: width, y: 2, z: depth },
    };
}

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsSPH',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.09, g: 0.10, b: 0.13, a: 1 },
        }, {
            __type__: 'PhysicsWorld',
            gravity: { x: 0, y: -9.82, z: 0 },
        }, {
            __type__: 'SPHSystem',
            density: 1,
            smoothingRadius: 1.2,
            speedOfSound: 25,
            viscosity: 0.08,
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 8, z: 18 },
            rotation: { x: -0.28, y: 0, z: 0 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            __type__: 'Object3D',
            name: 'Ground',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.20, g: 0.22, b: 0.26, a: 1 } },
                },
            }, { __type__: 'BoxCollider', width: 12, height: 1, depth: 12 }, { __type__: 'Rigidbody', mass: 0 }],
            scale: { x: 12, y: 1, z: 12 },
        },
        wall('Wall-Left', -3, 0, 0.4, 6),
        wall('Wall-Right', 3, 0, 0.4, 6),
        wall('Wall-Back', 0, -3, 6, 0.4),
        wall('Wall-Front', 0, 3, 6, 0.4),
        ...particles],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
