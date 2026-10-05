import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker } from 'feng3d';
import type { View } from 'feng3d';
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 弹性对比示例（对应 cannon-es 的 `bounce.html`）。
 *
 * 三个一模一样的球从同一高度落下，只有**弹性系数**不同（0.1 / 0.5 / 0.9），
 * 于是弹起的高度截然不同。
 *
 * 关于 restitution 的用法有个坑值得说明：cannon-es 的摩擦/弹性是**接触对**属性，
 * 它存在两种材质之间的 ContactMaterial 上，而不是单个物体上。
 * 所以这里给球声明 restitution 之后，PhysicsWorld 会自动为「球的材质 × 世界默认材质」
 * 注册 ContactMaterial（弹性取较大者），球才真的会弹。
 */
const BALLS = [
    { restitution: 0.1, color: { r: 0.55, g: 0.58, b: 0.64 }, label: 'restitution 0.1' },
    { restitution: 0.5, color: { r: 0.35, g: 0.75, b: 0.40 }, label: 'restitution 0.5' },
    { restitution: 0.9, color: { r: 0.90, g: 0.45, b: 0.30 }, label: 'restitution 0.9' },
];

const balls = BALLS.map((ball, i) => ({
    __type__: 'Object3D',
    name: 'Ball-' + (i + 1),
    position: { x: (i - 1) * 4, y: 9, z: 0 },
    components: [{
        __type__: 'MeshRenderer',
        geometry: { __type__: 'SphereGeometry', radius: 1 },
        material: {
            __type__: 'ColorMaterial',
            uniforms: {
                u_diffuseInput: { __type__: 'Color4', r: ball.color.r, g: ball.color.g, b: ball.color.b, a: 1 },
            },
        },
    }, {
        __type__: 'SphereCollider',
        radius: 1,
    }, {
        __type__: 'Rigidbody',
        mass: 1,
        restitution: ball.restitution,
    }],
}));

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsBounce',
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
            position: { x: 0, y: 8, z: 26 },
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
                    uniforms: {
                        u_diffuseInput: { __type__: 'Color4', r: 0.24, g: 0.27, b: 0.32, a: 1 },
                    },
                },
            }, {
                __type__: 'BoxCollider',
                width: 30,
                height: 1,
                depth: 30,
            }, {
                __type__: 'Rigidbody',
                mass: 0,
            }],
            scale: { x: 30, y: 1, z: 30 },
        }, ...balls],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
