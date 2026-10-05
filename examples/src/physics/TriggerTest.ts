import { WebGPU } from '@feng3d/webgpu';
import { logic, reactive, ticker } from 'feng3d';
import type { Color4, Object3D, View } from 'feng3d';
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 触发器示例（对应 cannon-es 的 `trigger.html`）。
 *
 * 两个球穿过中间那块"检测板"——板子设了 `isTrigger: true`，所以**不挡球**，
 * 但照常通过 onCollide 事件报告接触：每穿过一次，板子闪一下、计数加一。
 *
 * 这就是"触发器"与"穿透"的区别：只靠碰撞过滤也能让物体互相穿过，
 * 但那样**不会**有接触事件——触发器要的是"穿过但知道"。
 */
const TRIGGER_COLOR: Color4 = { __type__: 'Color4', r: 0.35, g: 0.55, b: 0.95, a: 1 };
let hitCount = 0;

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsTrigger',
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
            position: { x: 0, y: 4.5, z: 15 },
            rotation: { x: -0.1, y: 0, z: 0 },
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
            }, { __type__: 'BoxCollider', width: 30, height: 1, depth: 10 }, { __type__: 'Rigidbody', mass: 0 }],
            scale: { x: 30, y: 1, z: 10 },
        }, {
            // 检测板：isTrigger，不产生碰撞响应、但报告接触
            __type__: 'Object3D',
            name: 'Trigger',
            position: { x: 0, y: 1.8, z: 0 },
            scale: { x: 0.6, y: 3, z: 6 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: TRIGGER_COLOR } },
            }, { __type__: 'BoxCollider', width: 0.6, height: 3, depth: 6 }, {
                __type__: 'Rigidbody',
                mass: 0,
                isTrigger: true,
            }],
        }, {
            __type__: 'Object3D',
            name: 'Ball-1',
            position: { x: -7, y: 1.2, z: -1.5 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'SphereGeometry', radius: 0.6 },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.35, g: 0.75, b: 0.40, a: 1 } },
                },
            }, { __type__: 'SphereCollider', radius: 0.6 }, {
                __type__: 'Rigidbody',
                mass: 1,
                velocity: { x: 3, y: 0, z: 0 },
            }],
        }, {
            __type__: 'Object3D',
            name: 'Ball-2',
            position: { x: -10, y: 1.2, z: 1.5 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'SphereGeometry', radius: 0.6 },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.90, g: 0.75, b: 0.30, a: 1 } },
                },
            }, { __type__: 'SphereCollider', radius: 0.6 }, {
                __type__: 'Rigidbody',
                mass: 1,
                velocity: { x: 3.6, y: 0, z: 0 },
            }],
        }],
    },
};
const viewLogic = logic(view);

const physicsWorldLogic = logic(view.root.components![1]) as unknown as { onCollide: (l: (e: { objectA: Object3D | null; objectB: Object3D | null }) => void) => () => void };

physicsWorldLogic.onCollide((event) =>
{
    const names = [event.objectA?.name, event.objectB?.name];
    if (!names.includes('Trigger')) return;

    hitCount++;
    // 每穿过一次，检测板在蓝色与橙色之间切换
    const warm = hitCount % 2 === 0;
    reactive(TRIGGER_COLOR).r = warm ? 0.95 : 0.35;
    reactive(TRIGGER_COLOR).g = warm ? 0.55 : 0.55;
    reactive(TRIGGER_COLOR).b = warm ? 0.25 : 0.95;
});

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
