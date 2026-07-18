import { WebGPU } from '@feng3d/webgpu';
import { Color4, Object3D, reactive, ticker, View, logic, Scene } from 'feng3d';

let cubeRotation: { readonly x: number; readonly y: number; readonly z: number; };
let u_diffuseInput: Color4;

const sceneObject3D: Object3D = {
    __type__: 'Object3D',
    name: 'Untitled',
    components: [{
        __type__: 'Scene',
        background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
    }],
    children: [{
        __type__: 'Object3D',
        name: 'Main Camera',
        position: { x: 0, y: 1, z: -10 },
        components: [{
            __type__: 'Camera',
        }],
    }, {
        __type__: 'Object3D',
        name: 'Cube',
        rotation: cubeRotation = { x: 0, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry' },
            material: {
                __type__: 'ColorMaterial',
                uniforms: {
                    u_diffuseInput: u_diffuseInput = { __type__: 'Color4' },
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
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

const webgpu = await new WebGPU().init(); // 初始化WebGPU

const view: View = { __type__: 'View', canvas: webgpuCanvas, root: sceneObject3D };
const viewLogic = logic(view);

let num = 0;
ticker.onframe(() =>
{
    // 变化旋转与颜色
    reactive(cubeRotation).y += 1;

    num++;

    // ColorMaterial u_diffuseInput（已知可变色）— 每 60 帧
    if (num % 60 == 0)
    {
        reactive(u_diffuseInput).r = Math.random();
        reactive(u_diffuseInput).g = Math.random();
        reactive(u_diffuseInput).b = Math.random();
    }

    //
    viewLogic.update(); webgpu.submit(viewLogic.submit);;
});
