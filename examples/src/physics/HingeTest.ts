import { WebGPU } from '@feng3d/webgpu';
import { logic, ticker } from 'feng3d';
import type { View } from 'feng3d';
import '@feng3d/cannon-plugin';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化 WebGPU

/**
 * 铰链约束示例（对应 cannon-es 的 `hinge.html`）。
 *
 * 一扇门用 HingeConstraint 挂在一根静态横梁上，只能绕 **X 轴**转动。
 * 门初始是水平的（rotation.x = 1.15），于是重力把它拽下来、来回摆动几次后停住。
 *
 * 铰链的枢轴：横梁在 (0, 7, 0)，门板中心在 (0, 6, 0)（板高 2），
 * 所以 B 端枢轴取门板局部坐标的顶端 (0, 1, 0)，与横梁处对齐。
 */
const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'PhysicsHinge',
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
            position: { x: 0, y: 5, z: 14 },
            rotation: { x: -0.15, y: 0, z: 0 },
            components: [{ __type__: 'PerspectiveCamera' }],
        }, {
            // 静态横梁：铰链的 A 端
            __type__: 'Object3D',
            name: 'Beam',
            position: { x: 0, y: 7, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: {
                        u_diffuseInput: { __type__: 'Color4', r: 0.55, g: 0.58, b: 0.64, a: 1 },
                    },
                },
            }, {
                __type__: 'BoxCollider',
                width: 4,
                height: 0.4,
                depth: 0.4,
            }, {
                __type__: 'Rigidbody',
                mass: 0,
            }],
            scale: { x: 4, y: 0.4, z: 0.4 },
        }, {
            // 门板：铰链的 B 端，绕 X 轴转动
            __type__: 'Object3D',
            name: 'Door',
            position: { x: 0, y: 6, z: 0 },
            rotation: { x: 1.15, y: 0, z: 0 },
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
                width: 2.4,
                height: 2,
                depth: 0.2,
            }, {
                __type__: 'Rigidbody',
                mass: 1,
            }, {
                __type__: 'HingeConstraint',
                targetName: 'Beam',
                axisA: { x: 1, y: 0, z: 0 },
                axisB: { x: 1, y: 0, z: 0 },
                pivotA: { x: 0, y: 0, z: 0 },
                pivotB: { x: 0, y: 1, z: 0 },
            }],
            scale: { x: 2.4, y: 2, z: 0.2 },
        }],
    },
};
const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
