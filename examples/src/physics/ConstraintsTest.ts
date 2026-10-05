import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker } from 'feng3d';
import type { View } from 'feng3d';
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 距离约束示例（对应 cannon-es 的 `constraints.html`）。
 *
 * 一个静态锚点 + 三个球，首尾用 DistanceConstraint 连成一条链，靠重力摆动。
 *
 * 约束组件只能挂在其中一个刚体上，另一头用 **targetName 按名字引用**：
 * 每个球连到它上面那个（第一个球连到锚点）。名字必须在同一个 PhysicsWorld 子树内，
 * 由 PhysicsWorld 在两端刚体都就绪时创建 cannon-es 约束。
 */
const CHAIN = [
    { name: 'Ball-1', x: 1.5, y: 8.5 },
    { name: 'Ball-2', x: 3.0, y: 7.0 },
    { name: 'Ball-3', x: 4.5, y: 5.5 },
];

const COLORS = [
    { r: 0.35, g: 0.55, b: 0.95 },
    { r: 0.35, g: 0.75, b: 0.40 },
    { r: 0.90, g: 0.45, b: 0.30 },
];

const balls = CHAIN.map((ball, i) => ({
    __type__: 'Object3D',
    name: ball.name,
    position: { x: ball.x, y: ball.y, z: 0 },
    components: [{
        __type__: 'MeshRenderer',
        geometry: { __type__: 'SphereGeometry', radius: 0.4 },
        material: {
            __type__: 'ColorMaterial',
            uniforms: {
                u_diffuseInput: { __type__: 'Color4', r: COLORS[i].r, g: COLORS[i].g, b: COLORS[i].b, a: 1 },
            },
        },
    }, {
        __type__: 'SphereCollider',
        radius: 0.4,
    }, {
        __type__: 'Rigidbody',
        mass: 1,
    }, {
        __type__: 'DistanceConstraint',
        // 第一个球连锚点，其余连上一个球
        targetName: i === 0 ? 'Anchor' : CHAIN[i - 1].name,
        distance: 2.1,
    }],
}));

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsConstraints',
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
            position: { x: 2, y: 7, z: 18 },
            rotation: { x: -0.1, y: 0, z: 0 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            // 静态锚点：mass 0，不受重力，链子挂在它上面
            __type__: 'Object3D',
            name: 'Anchor',
            position: { x: 0, y: 10, z: 0 },
            scale: { x: 0.6, y: 0.6, z: 0.6 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: {
                        u_diffuseInput: { __type__: 'Color4', r: 0.55, g: 0.58, b: 0.64, a: 1 },
                    },
                },
            }, {
                __type__: 'BoxCollider',
                width: 0.6,
                height: 0.6,
                depth: 0.6,
            }, {
                __type__: 'Rigidbody',
                mass: 0,
            }],
        }, ...balls],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
