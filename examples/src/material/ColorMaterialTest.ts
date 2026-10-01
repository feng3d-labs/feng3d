import { WebGPU } from '@feng3d/webgpu';
import { findByName, getByPath, logic, reactive, ticker, type Color4, type Object3D, type View } from 'feng3d';

/**
 * ColorMaterial 示例：一个持续旋转、颜色周期性变化的立方体。
 *
 * ColorMaterial 的最终片元色 = 顶点色（a_color）× uniforms.u_diffuseInput；
 * 这里几何体用内置 CubeGeometry（顶点色恒为白色），颜色完全由 u_diffuseInput 驱动。
 *
 * 修改颜色走响应式数据接口：从原始对象读当前值 → 向 reactive 代理写新值（规范 8.4）。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 1, z: 5 },
            components: [{
                __type__: 'PerspectiveCamera',
            }],
        }, {
            __type__: 'Object3D',
            name: 'Cube',
            rotation: { x: 0, y: 0, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry', width: 2, height: 2, depth: 2 },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: {
                        u_diffuseInput: { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 },
                    },
                },
            }],
        }],
    },
};
const viewLogic = logic(view);

// 查询 API 获取可变引用（替代在字面量内捕获变量的技巧）
const cube = findByName(view.root, 'Cube') as Object3D;
const cubeRotation = cube.rotation as { readonly x: number; readonly y: number; readonly z: number };
const u_diffuseInput = getByPath(view, 'root/children/1/components/0/material/uniforms/u_diffuseInput') as Color4;

// 变化旋转与颜色
let num = 0;
ticker.onframe(() =>
{
    // rotation 单位为弧度，1° = π/180
    reactive(cubeRotation).y = cubeRotation.y + Math.PI / 180;
    reactive(cubeRotation).x = cubeRotation.x + Math.PI / 360;

    // ColorMaterial 的 u_diffuseInput：每 60 帧随机换色
    if (++num % 60 === 0)
    {
        reactive(u_diffuseInput).r = Math.random();
        reactive(u_diffuseInput).g = Math.random();
        reactive(u_diffuseInput).b = Math.random();
    }

    webgpu.submit(viewLogic.submit);
});
