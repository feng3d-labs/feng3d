import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker } from 'feng3d';
import type { View } from 'feng3d';
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 复合形状示例（对应 cannon-es 的 `compound.html`）。
 *
 * 一个「哑铃」由**三个碰撞体**拼成，它们都挂在同一个 Object3D 上、由同一个 Rigidbody 收集：
 * - 中间的杆：BoxCollider（2 × 0.3 × 0.3），offset 缺省（即原点）
 * - 两端的球：SphereCollider（半径 0.5），offset 分别是 ±(0.85, 0, 0)
 *
 * 这也是 `Collider.offset` 的用处：不声明偏移时三个形状会同心地叠在原点。
 * 视觉侧对应地用三个**子对象**（各自的 MeshRenderer）摆在同一位置上，
 * 父对象的 position / rotation 由物理驱动，子对象通过层级变换跟随。
 */
const dumbbell = {
    __type__: 'Object3D',
    name: 'Dumbbell',
    position: { x: 0, y: 7, z: 0 },
    rotation: { x: 0, y: 0, z: 0.35 },
    components: [{
        __type__: 'BoxCollider',
        width: 2,
        height: 0.3,
        depth: 0.3,
    }, {
        __type__: 'SphereCollider',
        radius: 0.5,
        offset: { x: -0.85, y: 0, z: 0 },
    }, {
        __type__: 'SphereCollider',
        radius: 0.5,
        offset: { x: 0.85, y: 0, z: 0 },
    }, {
        __type__: 'Rigidbody',
        mass: 1,
    }],
    children: [{
        __type__: 'Object3D',
        name: 'Bar',
        scale: { x: 2, y: 0.3, z: 0.3 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry' },
            material: {
                __type__: 'ColorMaterial',
                uniforms: {
                    u_diffuseInput: { __type__: 'Color4', r: 0.55, g: 0.58, b: 0.64, a: 1 },
                },
            },
        }],
    }, {
        __type__: 'Object3D',
        name: 'Ball-Left',
        position: { x: -0.85, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'SphereGeometry' },
            material: {
                __type__: 'ColorMaterial',
                uniforms: {
                    u_diffuseInput: { __type__: 'Color4', r: 0.90, g: 0.45, b: 0.30, a: 1 },
                },
            },
        }],
    }, {
        __type__: 'Object3D',
        name: 'Ball-Right',
        position: { x: 0.85, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'SphereGeometry' },
            material: {
                __type__: 'ColorMaterial',
                uniforms: {
                    u_diffuseInput: { __type__: 'Color4', r: 0.35, g: 0.55, b: 0.95, a: 1 },
                },
            },
        }],
    }],
};

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsCompound',
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
            position: { x: 0, y: 6, z: 16 },
            rotation: { x: -0.25, y: 0, z: 0 },
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
                width: 24,
                height: 1,
                depth: 24,
            }, {
                __type__: 'Rigidbody',
                mass: 0,
            }],
            scale: { x: 24, y: 1, z: 24 },
        }, dumbbell],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
