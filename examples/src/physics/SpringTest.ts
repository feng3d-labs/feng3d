import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker } from 'feng3d';
import type { View } from 'feng3d';
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 弹簧示例（对应 cannon-es 的 `spring.html`）。
 *
 * 三个球分别挂在静态横梁下，弹性系数各不相同（30 / 80 / 200，另加阻尼）：
 * 劲度越小晃得越久、越大越快回到静止长度。
 *
 * 弹簧与约束的区别值得注意：`Spring` **不是 Constraint**，它不参与约束求解，
 * 而是每帧自己算一次力——所以 PhysicsWorld 里为它留了一个「步进前钩子」，
 * 在 `world.step()` 之前逐个 `applyForce()`。
 *
 * 初始时故意把球放在**比静止长度更低**的位置，这样一放开就能看到弹动。
 */
const SPRINGS = [
    { x: -3, stiffness: 30, damping: 0.6, color: { r: 0.35, g: 0.75, b: 0.40 } },
    { x: 0, stiffness: 80, damping: 1.2, color: { r: 0.35, g: 0.55, b: 0.95 } },
    { x: 3, stiffness: 200, damping: 3, color: { r: 0.90, g: 0.45, b: 0.30 } },
];

const REST = 4;
const ANCHOR_Y = 9;
const START_DROP = 2.2;

const balls = SPRINGS.map((s, i) => ({
    __type__: 'Object3D',
    name: 'Ball-' + (i + 1),
    position: { x: s.x, y: ANCHOR_Y - REST - START_DROP, z: 0 },
    components: [{
        __type__: 'MeshRenderer',
        geometry: { __type__: 'SphereGeometry', radius: 0.45 },
        material: {
            __type__: 'ColorMaterial',
            uniforms: { u_diffuseInput: { __type__: 'Color4', r: s.color.r, g: s.color.g, b: s.color.b, a: 1 } },
        },
    }, { __type__: 'SphereCollider', radius: 0.45 }, { __type__: 'Rigidbody', mass: 1 }, {
        __type__: 'Spring',
        targetName: 'Beam',
        restLength: REST,
        stiffness: s.stiffness,
        damping: s.damping,
        // 锚点挂在梁的下表面；A 端是球，所以本地锚点在球心（缺省）
        localAnchorB: { x: s.x, y: 0, z: 0 },
    }],
}));

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsSpring',
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
            position: { x: 0, y: 6, z: 18 },
            rotation: { x: -0.1, y: 0, z: 0 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            __type__: 'Object3D',
            name: 'Beam',
            position: { x: 0, y: ANCHOR_Y, z: 0 },
            scale: { x: 10, y: 0.4, z: 1 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.55, g: 0.58, b: 0.64, a: 1 } },
                },
            }, { __type__: 'BoxCollider', width: 10, height: 0.4, depth: 1 }, { __type__: 'Rigidbody', mass: 0 }],
        }, ...balls],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
