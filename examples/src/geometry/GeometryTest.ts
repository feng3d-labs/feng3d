import { WebGPU } from '@feng3d/webgpu';
import { logic, reactive, ticker, type View } from 'feng3d';

/**
 * 几何体组合示例：同一场景中组合 PlaneGeometry（地面）/ SphereGeometry / CubeGeometry，
 * 整体旋转，并让球的颜色周期性变化。
 *
 * 对照旧版写法（CustomGeometry.addGeometry(geometry, matrix) 把多个几何体按矩阵合并成一份顶点数据）：
 * 现在改为「一个几何体一个 Object3D 子节点」，位置/旋转由 Object3D 的 transform 表达
 * （纯数据声明式，见 AGENTS.md 第 2 章）；整体旋转由父节点 models 的 rotation 驱动。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 需要逐帧修改的数据：从原始对象读当前值、向响应式代理写新值（规范 8.4）
let modelsRotation: { readonly x: number; readonly y: number; readonly z: number };
let sphereColor: { readonly __type__: 'Color4'; readonly r: number; readonly g: number; readonly b: number; readonly a: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 3, z: 8 },
            components: [{
                __type__: 'PerspectiveCamera',
            }],
        }, {
            // 地面（yUp 缺省为 true → 水平面，法线 +Y 朝上；相机在上方可见）
            __type__: 'Object3D',
            name: 'plane',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'PlaneGeometry', width: 10, height: 10, segmentsW: 1, segmentsH: 1 },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 } },
                },
            }],
        }, {
            // 组合体：整体绕 y 轴旋转
            __type__: 'Object3D',
            name: 'models',
            rotation: modelsRotation = { x: 0, y: 0, z: 0 },
            children: [{
                __type__: 'Object3D',
                name: 'sphere',
                position: { x: 0, y: 1, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SphereGeometry', radius: 1, segmentsW: 32, segmentsH: 24, yUp: true },
                    material: {
                        __type__: 'ColorMaterial',
                        uniforms: {
                            u_diffuseInput: sphereColor = { __type__: 'Color4', r: 0, g: 1, b: 0, a: 1 },
                        },
                    },
                }],
            }, {
                __type__: 'Object3D',
                name: 'cube1',
                position: { x: 0, y: 2.2, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CubeGeometry', width: 0.8, height: 0.8, depth: 0.8 },
                    material: {
                        __type__: 'ColorMaterial',
                        uniforms: { u_diffuseInput: { __type__: 'Color4', r: 1, g: 0.2, b: 0.2, a: 1 } },
                    },
                }],
            }, {
                // 与 cube1 同位、绕 z 轴旋转 45°（叠加成星形轮廓）
                __type__: 'Object3D',
                name: 'cube2',
                position: { x: 0, y: 2.2, z: 0 },
                rotation: { x: 0, y: 0, z: Math.PI / 4 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CubeGeometry', width: 0.8, height: 0.8, depth: 0.8 },
                    material: {
                        __type__: 'ColorMaterial',
                        uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.2, g: 0.4, b: 1, a: 1 } },
                    },
                }],
            }],
        }],
    },
};
const viewLogic = logic(view);

let num = 0;
ticker.onframe(() =>
{
    // 整体旋转（rotation 单位为弧度，1° = π/180）
    reactive(modelsRotation).y = modelsRotation.y + Math.PI / 180;

    // 球的颜色：每 60 帧随机换色
    if (++num % 60 === 0)
    {
        reactive(sphereColor).r = Math.random();
        reactive(sphereColor).g = Math.random();
        reactive(sphereColor).b = Math.random();
    }

    webgpu.submit(viewLogic.submit);
});
