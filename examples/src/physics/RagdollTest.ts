import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker } from 'feng3d';
import type { View } from 'feng3d';
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 布娃娃示例（对应 cannon-es 的 `ragdoll.html`）。
 *
 * 用**约束拼**出一个简化人形（躯干 + 头 + 两条腿），从空中落下后摊在地上。
 * 关节全部由已有约束组件表达：
 * - 脖子：`PointToPointConstraint`（球铰——两点钉在一起，可自由转）
 * - 髋关节：`HingeConstraint`（只能绕 X 轴摆）
 *
 * 这一条没有用到任何"专用 ragdoll 组件"——ragdoll 本质就是"一串被约束连起来的刚体"，
 * 所以它是对约束组件族最好的检验。
 *
 * 关节的 pivot 都是**相对各自刚体质心**的局部坐标，两端要落在同一个世界点上：
 * 躯干中心 (0,7,0)、高 2；头的中心 (0,8.6,0)、半径 0.5；腿中心 (∓0.5,5,0)、高 2。
 */
const BODY = { r: 0.55, g: 0.58, b: 0.64 };
const HEAD = { r: 0.90, g: 0.65, b: 0.35 };
const LEG = { r: 0.35, g: 0.55, b: 0.95 };

function mesh(color: { r: number; g: number; b: number }, geometry: Record<string, unknown>)
{
    return {
        __type__: 'MeshRenderer',
        geometry,
        material: {
            __type__: 'ColorMaterial',
            uniforms: { u_diffuseInput: { __type__: 'Color4', r: color.r, g: color.g, b: color.b, a: 1 } },
        },
    };
}

const TORSO_Y = 7;

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsRagdoll',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.09, g: 0.10, b: 0.13, a: 1 },
        }, {
            __type__: 'PhysicsWorld',
            gravity: { x: 0, y: -9.82, z: 0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 3, y: 6, z: 14 },
            rotation: { x: -0.12, y: 0.2, z: 0 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            __type__: 'Object3D',
            name: 'Ground',
            components: [mesh({ r: 0.24, g: 0.27, b: 0.32 }, { __type__: 'CubeGeometry' }),
                { __type__: 'BoxCollider', width: 30, height: 1, depth: 30 }, { __type__: 'Rigidbody', mass: 0 }],
            scale: { x: 30, y: 1, z: 30 },
        }, {
            __type__: 'Object3D',
            name: 'Torso',
            position: { x: 0, y: TORSO_Y, z: 0 },
            scale: { x: 1.6, y: 2, z: 0.8 },
            components: [mesh(BODY, { __type__: 'CubeGeometry' }),
                { __type__: 'BoxCollider', width: 1.6, height: 2, depth: 0.8 }, { __type__: 'Rigidbody', mass: 2 }],
        }, {
            __type__: 'Object3D',
            name: 'Head',
            position: { x: 0, y: 8.6, z: 0 },
            components: [mesh(HEAD, { __type__: 'SphereGeometry', radius: 0.5 }),
                { __type__: 'SphereCollider', radius: 0.5 }, { __type__: 'Rigidbody', mass: 1 }, {
                    __type__: 'PointToPointConstraint',
                    targetName: 'Torso',
                    // A 端（头）底部 → B 端（躯干）顶部，两点都落在 (0,8,0)
                    pivotA: { x: 0, y: -0.5, z: 0 },
                    pivotB: { x: 0, y: 1, z: 0 },
                }],
        }, {
            __type__: 'Object3D',
            name: 'Leg-Left',
            position: { x: -0.5, y: 5, z: 0 },
            scale: { x: 0.6, y: 2, z: 0.6 },
            components: [mesh(LEG, { __type__: 'CubeGeometry' }),
                { __type__: 'BoxCollider', width: 0.6, height: 2, depth: 0.6 }, { __type__: 'Rigidbody', mass: 1 }, {
                    __type__: 'HingeConstraint',
                    targetName: 'Torso',
                    axisA: { x: 1, y: 0, z: 0 },
                    axisB: { x: 1, y: 0, z: 0 },
                    pivotA: { x: 0, y: 1, z: 0 },
                    pivotB: { x: -0.5, y: -1, z: 0 },
                }],
        }, {
            __type__: 'Object3D',
            name: 'Leg-Right',
            position: { x: 0.5, y: 5, z: 0 },
            scale: { x: 0.6, y: 2, z: 0.6 },
            components: [mesh(LEG, { __type__: 'CubeGeometry' }),
                { __type__: 'BoxCollider', width: 0.6, height: 2, depth: 0.6 }, { __type__: 'Rigidbody', mass: 1 }, {
                    __type__: 'HingeConstraint',
                    targetName: 'Torso',
                    axisA: { x: 1, y: 0, z: 0 },
                    axisB: { x: 1, y: 0, z: 0 },
                    pivotA: { x: 0, y: 1, z: 0 },
                    pivotB: { x: 0.5, y: -1, z: 0 },
                }],
        }],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
