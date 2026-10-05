import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker } from 'feng3d';
import type { View } from 'feng3d';
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 堆积示例（对应 cannon-es 的 `pile.html` / `stacks.html`）。
 *
 * 3×3 共 9 个方块从同一高度落下，先砸在地面上、再互相碰撞堆成一堆。
 * 这是对「多刚体 + 接触求解 + 旋转写回」最直观的检验：
 * 若没有旋转同步，方块会笔直落下、堆得整整齐齐，看起来就很假。
 */
const COLORS = [
    { r: 0.90, g: 0.35, b: 0.30 },
    { r: 0.35, g: 0.75, b: 0.40 },
    { r: 0.35, g: 0.55, b: 0.95 },
];

const SIZE = 1.5;
const GAP = 1.7;

const boxes = [];
let index = 0;
for (const x of [-GAP, 0, GAP])
{
    for (const z of [-GAP, 0, GAP])
    {
        const color = COLORS[index % COLORS.length];
        index++;
        boxes.push({
            __type__: 'Object3D',
            name: 'Box-' + index,
            position: { x, y: 9, z },
            scale: { x: SIZE, y: SIZE, z: SIZE },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: {
                        u_diffuseInput: { __type__: 'Color4', r: color.r, g: color.g, b: color.b, a: 1 },
                    },
                },
            }, {
                __type__: 'BoxCollider',
                width: SIZE,
                height: SIZE,
                depth: SIZE,
            }, {
                __type__: 'Rigidbody',
                mass: 1,
            }],
        });
    }
}

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsPile',
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
            position: { x: 0, y: 8, z: 22 },
            rotation: { x: -0.3, y: 0, z: 0 },
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
        }, ...boxes],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
