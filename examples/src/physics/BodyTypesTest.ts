import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker } from 'feng3d';
import type { View } from 'feng3d';
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 刚体类型示例（对应 cannon-es 的 `body_types.html`）。
 *
 * 三种类型同台对比（都用同一个下落物去碰它们）：
 * - `dynamic`：受重力，会自由下落；
 * - `static`：永不动，但挡得住别人（地面就是这一类，这里再放一块悬空的）；
 * - `kinematic`：不受力，但按 `velocity` 匀速平移，且会把别人推开。
 *
 * 类型由 `Rigidbody.type` 指定；不写时 cannon-es 按 mass 推断（>0 动态、=0 静态）。
 */
const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsBodyTypes',
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
            position: { x: 0, y: 7, z: 24 },
            rotation: { x: -0.22, y: 0, z: 0 },
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
            }, { __type__: 'BoxCollider', width: 30, height: 1, depth: 30 }, { __type__: 'Rigidbody', mass: 0 }],
            scale: { x: 30, y: 1, z: 30 },
        }, {
            // static：悬空挡板，永远不动
            __type__: 'Object3D',
            name: 'Static-Shelf',
            position: { x: -6, y: 4, z: 0 },
            scale: { x: 6, y: 0.4, z: 6 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.55, g: 0.58, b: 0.64, a: 1 } },
                },
            }, { __type__: 'BoxCollider', width: 6, height: 0.4, depth: 6 }, { __type__: 'Rigidbody', mass: 0, type: 'static' }],
        }, {
            // kinematic：沿 +X 匀速平移的挡板
            __type__: 'Object3D',
            name: 'Kinematic-Bar',
            position: { x: -8, y: 2.5, z: 0 },
            scale: { x: 1, y: 4, z: 1 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.35, g: 0.55, b: 0.95, a: 1 } },
                },
            }, { __type__: 'BoxCollider', width: 1, height: 4, depth: 1 }, {
                __type__: 'Rigidbody',
                mass: 1,
                type: 'kinematic',
                velocity: { x: 2.5, y: 0, z: 0 },
            }],
        }, {
            // dynamic：受重力下落，会先落在 static 挡板上、再被 kinematic 挡板推走
            __type__: 'Object3D',
            name: 'Dynamic-Box',
            position: { x: -6, y: 9, z: 0 },
            scale: { x: 1.6, y: 1.6, z: 1.6 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.90, g: 0.45, b: 0.30, a: 1 } },
                },
            }, { __type__: 'BoxCollider', width: 1.6, height: 1.6, depth: 1.6 }, { __type__: 'Rigidbody', mass: 1, type: 'dynamic' }],
        }],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
