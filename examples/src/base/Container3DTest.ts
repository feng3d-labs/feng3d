import { WebGPU } from '@feng3d/webgpu';
import { Color4, reactive, ticker, View, logic, findByName, getByPath } from 'feng3d';
import type { Object3D } from 'feng3d';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init(); // 初始化WebGPU

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
            position: { x: 0, y: 1, z: 10 },
            components: [{
                __type__: 'PerspectiveCamera',
            }],
        }, {
            __type__: 'Object3D',
            name: 'Cube',
            rotation: { x: 0, y: 0, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'ColorMaterial',
                    uniforms: {
                        u_diffuseInput: { __type__: 'Color4' },
                    },
                },
            }],
            children: [{
                __type__: 'Object3D',
                name: 'Cylinder',
                position: { x: 2, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CylinderGeometry' },
                }],
            }],
        }],
    },
};
const viewLogic = logic(view);

// 查询 API 获取可变引用（设计 3.4：替代在字面量内捕获变量的技巧）
const cube = findByName(view.root, 'Cube') as Object3D;
const cubeRotation = cube.rotation as { readonly x: number; readonly y: number; readonly z: number };
const u_diffuseInput = getByPath(view, 'root/children/1/components/0/material/uniforms/u_diffuseInput') as Color4;

let num = 0;
ticker.onframe(() =>
{
    // 变化旋转与颜色（rotation 单位为弧度，1° = π/180）
    // 从原始对象读当前值、向响应式代理写新值（规范 8.4，避免读响应式建立依赖）
    reactive(cubeRotation).y = cubeRotation.y + Math.PI / 180;

    num++;

    // ColorMaterial u_diffuseInput（已知可变色）— 每 60 帧
    if (num % 60 == 0)
    {
        reactive(u_diffuseInput).r = Math.random();
        reactive(u_diffuseInput).g = Math.random();
        reactive(u_diffuseInput).b = Math.random();
    }

    //
    webgpu.submit(viewLogic.submit);
});
