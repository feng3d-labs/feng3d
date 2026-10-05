import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker } from 'feng3d';
import type { View } from 'feng3d';
// 副作用导入：注册 PhysicsWorld / Rigidbody / BoxCollider 的 Logic 工厂。
// 只作类型标注的 import 会被转译器整条擦除，那样 logic({ __type__: 'PhysicsWorld' }) 会返回 null。
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 物理示例：三个方块受重力落到地面上并堆叠。
 *
 * 每个方块同时挂三种组件，且**视觉尺寸与物理尺寸保持一致**：
 * - MeshRenderer（视觉：CubeGeometry + 纯色材质，由 Object3D.scale 定尺寸）
 * - BoxCollider（物理形状：边长与视觉一致）
 * - Rigidbody（质量 1，参与动力学）
 *
 * PhysicsWorld 挂在场景根上：它每帧把子树里的 Rigidbody 注册进 cannon-es 的 World、
 * 步进一次，再把刚体位置写回各自的 Object3D。步进由 View.submit 的 getter 驱动
 * （它内部会调 Scene.update()，Scene 再驱动 PhysicsWorld.update），因此这里不需要手动 step。
 */
const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsBoxFall',
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
            // 地面：静态刚体（mass 0 = 静态，不受重力）。视觉是同一个立方体按 scale 压扁拉大。
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
        }, {
            __type__: 'Object3D',
            name: 'Box-1',
            position: { x: -2, y: 12, z: 0 },
            scale: { x: 1.5, y: 1.5, z: 1.5 },
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
                width: 1.5,
                height: 1.5,
                depth: 1.5,
            }, {
                __type__: 'Rigidbody',
                mass: 1,
            }],
        }, {
            __type__: 'Object3D',
            name: 'Box-2',
            position: { x: 0.5, y: 16, z: -1 },
            scale: { x: 1.5, y: 1.5, z: 1.5 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: {
                        u_diffuseInput: { __type__: 'Color4', r: 0.35, g: 0.75, b: 0.40, a: 1 },
                    },
                },
            }, {
                __type__: 'BoxCollider',
                width: 1.5,
                height: 1.5,
                depth: 1.5,
            }, {
                __type__: 'Rigidbody',
                mass: 1,
            }],
        }, {
            __type__: 'Object3D',
            name: 'Box-3',
            position: { x: 2.5, y: 20, z: 1 },
            scale: { x: 1.5, y: 1.5, z: 1.5 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: {
                        u_diffuseInput: { __type__: 'Color4', r: 0.35, g: 0.55, b: 0.95, a: 1 },
                    },
                },
            }, {
                __type__: 'BoxCollider',
                width: 1.5,
                height: 1.5,
                depth: 1.5,
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
    // View.submit 的 getter 内部会驱动 Scene.update()（含 PhysicsWorld 步进与刚体位置写回）
    webgpu.submit(viewLogic.submit);
});
