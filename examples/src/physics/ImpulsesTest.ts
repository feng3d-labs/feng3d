import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker } from 'feng3d';
import type { Object3D, View } from 'feng3d';
import '@feng3d/cannon-plugin';
import type { RigidbodyLogic } from '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 冲量示例（对应 cannon-es 的 `impulses.html`）。
 *
 * 三个球排成一排，每 1.2 秒被**施加一次向上的冲量**，于是反复弹起——高度按质量与冲量大小递减。
 *
 * 冲量通过 `RigidbodyLogic.applyImpulse()` 施加：它是**一次性**的（调用一次即改变动量），
 * 与每帧都要调的 `applyForce()` 不同。这是运行时交互，所以走 Logic 的方法而不是数据字段。
 */
const BALLS = [
    { x: -3, mass: 1, color: { r: 0.90, g: 0.45, b: 0.30 } },
    { x: 0, mass: 2, color: { r: 0.35, g: 0.75, b: 0.40 } },
    { x: 3, mass: 4, color: { r: 0.35, g: 0.55, b: 0.95 } },
];

const ballObjects = BALLS.map((b, i) => ({
    __type__: 'Object3D',
    name: 'Ball-' + (i + 1),
    position: { x: b.x, y: 1.2, z: 0 },
    components: [{
        __type__: 'MeshRenderer',
        geometry: { __type__: 'SphereGeometry', radius: 0.6 },
        material: {
            __type__: 'ColorMaterial',
            uniforms: { u_diffuseInput: { __type__: 'Color4', r: b.color.r, g: b.color.g, b: b.color.b, a: 1 } },
        },
    }, { __type__: 'SphereCollider', radius: 0.6 }, { __type__: 'Rigidbody', mass: b.mass }],
}));

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsImpulses',
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
            position: { x: 0, y: 5, z: 16 },
            rotation: { x: -0.12, y: 0, z: 0 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            __type__: 'Object3D',
            name: 'Ground',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.24, g: 0.27, b: 0.32, a: 1 } },
                },
            }, { __type__: 'BoxCollider', width: 24, height: 1, depth: 12 }, { __type__: 'Rigidbody', mass: 0 }],
            scale: { x: 24, y: 1, z: 12 },
        }, ...ballObjects],
    },
};
const viewLogic = logic(view);

// 取到三个球的 logic，供施加冲量用
const ballLogics = BALLS.map((_, i) => logic(ballObjects[i] as unknown as Object3D) as unknown as RigidbodyLogic);

let elapsed = 0;
ticker.onframe((interval) =>
{
    elapsed += interval;

    if (elapsed >= 1200)
    {
        elapsed = 0;
        // 同一个冲量下，质量越大的球被推得越低
        for (const ballLogic of ballLogics) ballLogic.applyImpulse({ x: 0, y: 7, z: 0 });
    }

    webgpu.submit(viewLogic.submit);
});
