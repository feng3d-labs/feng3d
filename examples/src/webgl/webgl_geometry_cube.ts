import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromUrl, logic, Object3D, reactive, Scene, View, ticker } from 'feng3d';

/**
 * 展示一个贴着木箱纹理的旋转立方体（最基础的 Hello World）。
 *
 * 对照 three.js：examples/webgl_geometry_cube.html
 * - BoxGeometry + MeshBasicMaterial({ map }) → CubeGeometry + TextureMaterial（s_texture）
 * - 立方体每帧 rotation.x += 0.005, rotation.y += 0.01
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 加载木箱纹理
const crateTexture = await createTextureFromUrl('/crate.gif');

// 立方体（旋转动画）
let cubeRot: { readonly x: number; readonly y: number; readonly z: number };
const cubeNode: Object3D = {
    __type__: 'Object3D',
    name: 'crate',
    rotation: cubeRot = { x: 0, y: 0, z: 0 },
    components: [{
        __type__: 'MeshRenderer',
        geometry: { __type__: 'CubeGeometry', width: 1, height: 1, depth: 1 },
        material: {
            __type__: 'TextureMaterial',
            uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
            s_texture: crateTexture as unknown as never,
        },
    }],
};

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
            ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 2 },
                components: [
                    { __type__: 'PerspectiveCamera', fov: 70, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100 },
                ],
            },
            cubeNode,
        ],
    },
};

const viewLogic = logic(view);
ticker.onframe(() =>
{
    reactive(cubeRot).x += 0.005;
    reactive(cubeRot).y += 0.01;
    webgpu.submit(viewLogic.submit);
});
