import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker } from 'feng3d';
import type { View } from 'feng3d';
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 碰撞过滤示例（对应 cannon-es 的 `collision_filter.html`）。
 *
 * 两组物体同时落下，各自的 `collisionFilterGroup` / `collisionFilterMask` 只认自己那一组：
 * 于是**红色组与蓝色组彼此穿过**（地面属于默认组 1，所以 —— 见下），而同组之间正常堆叠。
 *
 * 位掩码的判据是 `(A.group & B.mask) !== 0 && (B.group & A.mask) !== 0`：
 * - 红组：group 2、mask 2 → 只与红组碰撞
 * - 蓝组：group 4、mask 4 → 只与蓝组碰撞
 *
 * 注意地面用默认 group 1 / mask -1，所以它**谁都挡**——为了让两组都停在地上，
 * 这里把两组的 mask 各补上 1（即 `mask: 2 | 1` / `4 | 1`），它们仍互相穿过。
 */
const RED = { r: 0.90, g: 0.35, b: 0.30 };
const BLUE = { r: 0.35, g: 0.55, b: 0.95 };

function block(name: string, x: number, z: number, color: { r: number; g: number; b: number }, group: number, mask: number)
{
    return {
        __type__: 'Object3D',
        name,
        position: { x, y: 6 + x * 0.3, z },
        scale: { x: 1.4, y: 1.4, z: 1.4 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry' },
            material: {
                __type__: 'ColorMaterial',
                uniforms: { u_diffuseInput: { __type__: 'Color4', r: color.r, g: color.g, b: color.b, a: 1 } },
            },
        }, { __type__: 'BoxCollider', width: 1.4, height: 1.4, depth: 1.4 }, {
            __type__: 'Rigidbody',
            mass: 1,
            collisionFilterGroup: group,
            collisionFilterMask: mask,
        }],
    };
}

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsCollisionFilter',
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
            position: { x: 0, y: 8, z: 20 },
            rotation: { x: -0.35, y: 0, z: 0 },
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
        },
        // 红组与蓝组各三个，沿 Z 排开；两组在 X 方向重叠，理应彼此穿过
        block('Red-1', -1, -2.2, RED, 2, 2 | 1),
        block('Red-2', -1, 0, RED, 2, 2 | 1),
        block('Red-3', -1, 2.2, RED, 2, 2 | 1),
        block('Blue-1', 1, -2.2, BLUE, 4, 4 | 1),
        block('Blue-2', 1, 0, BLUE, 4, 4 | 1),
        block('Blue-3', 1, 2.2, BLUE, 4, 4 | 1)],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
