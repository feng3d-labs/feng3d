import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker } from 'feng3d';
import type { View } from 'feng3d';
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 固定旋转示例（对应 cannon-es 的 `fixed_rotation.html`）。
 *
 * 两个方块从同一个斜坡上滑下：
 * - 左边 `fixedRotation: true` —— 只平动、不翻滚，姿态保持不变；
 * - 右边不设该字段 —— 被摩擦带着翻滚，姿态一直在变。
 *
 * 斜坡靠给地面 Object3D 一个绕 Z 的旋转实现（rotation.z = 0.28，+X 侧升高），
 * 这一步依赖"刚体旋转同步"（地面的朝向从 Object3D.rotation 同步给刚体）。
 */
const SLOPE = 0.28;
const START_X = 8;

function block(name: string, z: number, color: { r: number; g: number; b: number }, fixedRotation: boolean)
{
    return {
        __type__: 'Object3D',
        name,
        position: { x: START_X, y: START_X * Math.sin(SLOPE) + 1.3, z },
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
            friction: 0.75,
            fixedRotation,
        }],
    };
}

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsFixedRotation',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.09, g: 0.10, b: 0.13, a: 1 },
        }, {
            __type__: 'PhysicsWorld',
            gravity: { x: 0, y: -9.82, z: 0 },
            friction: 0.75,
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 11, z: 22 },
            rotation: { x: -0.45, y: 0, z: 0 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            __type__: 'Object3D',
            name: 'Slope',
            rotation: { x: 0, y: 0, z: SLOPE },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.24, g: 0.27, b: 0.32, a: 1 } },
                },
            }, { __type__: 'BoxCollider', width: 30, height: 1, depth: 12 }, { __type__: 'Rigidbody', mass: 0 }],
            scale: { x: 30, y: 1, z: 12 },
        },
        block('Fixed-Rotation', -2, { r: 0.35, g: 0.75, b: 0.40 }, true),
        block('Free-Rotation', 2, { r: 0.90, g: 0.45, b: 0.30 }, false)],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
