import { WebGPU } from '@feng3d/webgpu';
import { logic, reactive, ticker } from 'feng3d';
import type { Color4, Object3D, View } from 'feng3d';
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 碰撞事件示例（对应 cannon-es 的 `events.html` / `callbacks.html`）。
 *
 * 一排方块静止在地面上，一个球从天而降；球碰到哪个方块，哪个方块就被"点亮"成红色。
 *
 * 事件来自 `PhysicsWorldLogic.onCollide()`——它把 cannon-es 的 `beginContact` 转成带
 * **Object3D** 的载荷（不只是物理刚体），所以回调里能直接找到场景对象、再改它的数据。
 */
const COLORS = [
    { r: 0.35, g: 0.55, b: 0.95 },
    { r: 0.35, g: 0.75, b: 0.40 },
    { r: 0.90, g: 0.75, b: 0.30 },
    { r: 0.65, g: 0.45, b: 0.85 },
];

/** 方块名字 → 它的颜色数据（碰撞时直接改这个引用） */
const colorOf = new Map<string, Color4>();

const blocks = COLORS.map((c, i) => {
    const name = 'Block-' + (i + 1);
    const color: Color4 = { __type__: 'Color4', r: c.r, g: c.g, b: c.b, a: 1 };
    colorOf.set(name, color);

    return {
        __type__: 'Object3D',
        name,
        position: { x: (i - 1.5) * 2.2, y: 1.2, z: 0 },
        scale: { x: 1.6, y: 1.6, z: 1.6 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry' },
            material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: color } },
        }, { __type__: 'BoxCollider', width: 1.6, height: 1.6, depth: 1.6 }, { __type__: 'Rigidbody', mass: 0 }],
    };
});

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsEvents',
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
        }, ...blocks, {
            // 落下来的球：它会依次碰到方块，触发事件
            __type__: 'Object3D',
            name: 'Ball',
            position: { x: -8, y: 8, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'SphereGeometry', radius: 0.7 },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.90, g: 0.30, b: 0.30, a: 1 } },
                },
            }, { __type__: 'SphereCollider', radius: 0.7 }, {
                __type__: 'Rigidbody',
                mass: 1,
                // 给一个水平初速度，让它依次滚过四个方块
                velocity: { x: 4, y: 0, z: 0 },
            }],
        }],
    },
};
const viewLogic = logic(view);

const physicsWorldLogic = logic(view.root.components![1]) as unknown as { onCollide: (l: (e: { objectA: Object3D | null; objectB: Object3D | null }) => void) => () => void };

physicsWorldLogic.onCollide((event) =>
{
    for (const object3D of [event.objectA, event.objectB])
    {
        const color = object3D === null ? undefined : colorOf.get(object3D.name);
        if (color === undefined) continue;

        // 点亮：改成高亮红（写的是纯数据字段，经 reactive 触发重绘）
        reactive(color).r = 1;
        reactive(color).g = 0.25;
        reactive(color).b = 0.2;
    }
});

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
