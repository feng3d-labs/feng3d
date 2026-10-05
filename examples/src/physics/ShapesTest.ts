import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker } from 'feng3d';
import type { View } from 'feng3d';
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 形状总览示例（对应 cannon-es 的 `shapes.html`）。
 *
 * 四种碰撞体同时从同一高度落下，落到同一块地面上：
 * - BoxCollider    + CubeGeometry（边长 2）
 * - SphereCollider + SphereGeometry（半径 1）
 * - CylinderCollider + CylinderGeometry（竖放，半径 0.5 / 高 2）
 * - CylinderCollider + CylinderGeometry（横放：靠 Object3D.rotation 绕 Z 转 90°）
 *
 * 两处「视觉与物理必须对齐」的地方：
 * 1. 引擎的 CubeGeometry 是 1×1×1，视觉尺寸靠 Object3D.scale，因此 scale 要与 Collider 尺寸同值；
 * 2. cannon-es 的 Cylinder 与引擎的 CylinderGeometry（yUp 默认 true）都沿 Y 轴，
 *    所以竖放不用转、横放只需把整个 Object3D 绕 Z 转 90°——刚体的初始旋转会从 rotation 同步过去。
 */
const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsShapes',
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
            position: { x: 0, y: 9, z: 26 },
            rotation: { x: -0.32, y: 0, z: 0 },
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
                width: 40,
                height: 1,
                depth: 40,
            }, {
                __type__: 'Rigidbody',
                mass: 0,
            }],
            scale: { x: 40, y: 1, z: 40 },
        }, {
            __type__: 'Object3D',
            name: 'Box',
            position: { x: -6, y: 6, z: 0 },
            scale: { x: 2, y: 2, z: 2 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: {
                        u_diffuseInput: { __type__: 'Color4', r: 0.90, g: 0.35, b: 0.30, a: 1 },
                    },
                },
            }, {
                __type__: 'BoxCollider',
                width: 2,
                height: 2,
                depth: 2,
            }, {
                __type__: 'Rigidbody',
                mass: 1,
            }],
        }, {
            __type__: 'Object3D',
            name: 'Sphere',
            position: { x: -2, y: 6, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'SphereGeometry', radius: 1 },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: {
                        u_diffuseInput: { __type__: 'Color4', r: 0.35, g: 0.75, b: 0.40, a: 1 },
                    },
                },
            }, {
                __type__: 'SphereCollider',
                radius: 1,
            }, {
                __type__: 'Rigidbody',
                mass: 1,
            }],
        }, {
            __type__: 'Object3D',
            name: 'CylinderUp',
            position: { x: 2, y: 6, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CylinderGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: {
                        u_diffuseInput: { __type__: 'Color4', r: 0.35, g: 0.55, b: 0.95, a: 1 },
                    },
                },
            }, {
                __type__: 'CylinderCollider',
            }, {
                __type__: 'Rigidbody',
                mass: 1,
            }],
        }, {
            __type__: 'Object3D',
            name: 'CylinderSide',
            position: { x: 6, y: 6, z: 0 },
            rotation: { x: 0, y: 0, z: Math.PI / 2 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CylinderGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: {
                        u_diffuseInput: { __type__: 'Color4', r: 0.90, g: 0.75, b: 0.30, a: 1 },
                    },
                },
            }, {
                __type__: 'CylinderCollider',
            }, {
                __type__: 'Rigidbody',
                mass: 1,
            }],
        }],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
