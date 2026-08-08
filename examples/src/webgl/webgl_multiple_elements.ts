import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromCanvas, createTextureFromUrl, logic, Object3D, reactive, Scene, TextureMaterial, View, ticker } from 'feng3d';

/** 多 Canvas 元素（多个独立 View）。对照 three.js webgl_multiple_elements.html
 * feng3d 一个 View 对应一个 canvas，用 2 个 canvas 实现多元素。 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 创建第二个 canvas（右上角小窗）
const miniCanvas = document.createElement('canvas');
miniCanvas.width = 320; miniCanvas.height = 240;
miniCanvas.setAttribute('style', 'position:absolute;top:10px;right:10px;width:320px;height:240px;border:2px solid #fff;');
document.body.appendChild(miniCanvas);

const tex = await createTextureFromUrl('/crate.gif') ?? null;

// 主场景：立方体
let cubeRot: { x: number; y: number; z: number };
const view1: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.3, a: 1 }, ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 5 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100 }] },
            { __type__: 'Object3D', name: 'cube', rotation: cubeRot = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CubeGeometry', width: 2, height: 2, depth: 2 },
                material: { __type__: 'TextureMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }, s_texture: tex as unknown as TextureMaterial['s_texture'] } }] },
        ],
    },
};

// 小窗场景：球体（不同视角）
const view2: View = {
    __type__: 'View', canvas: miniCanvas,
    root: {
        __type__: 'Object3D', name: 'Mini',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.3, g: 0.2, b: 0.2, a: 1 }, ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam2', position: { x: 3, y: 3, z: 3 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 60, aspect: miniCanvas.width / miniCanvas.height, near: 0.1, far: 100 }] },
            { __type__: 'Object3D', name: 'sphere', rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SphereGeometry', radius: 1, segmentsW: 32, segmentsH: 16 },
                material: { __type__: 'TextureMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } }, s_texture: tex as unknown as TextureMaterial['s_texture'] } }] },
        ],
    },
};

const vl1 = logic(view1);
const vl2 = logic(view2);

ticker.onframe(() =>
{
    reactive(cubeRot).x += 0.01;
    reactive(cubeRot).y += 0.02;
    webgpu.submit(vl1.submit);
    webgpu.submit(vl2.submit);
});
