import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, NormalMaterial, View, ticker } from 'feng3d';
import '@feng3d/addons';

/**
 * 展示 NormalMaterial（法线可视化材质）：多个几何体用法线方向着色。
 * 对应 three.js MeshNormalMaterial 效果。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const normalMat: NormalMaterial = { __type__: 'NormalMaterial' };

let rot1: { readonly x: number; readonly y: number; readonly z: number };
let rot2: { readonly x: number; readonly y: number; readonly z: number };
let rot3: { readonly x: number; readonly y: number; readonly z: number };
let rot4: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 0, z: 12 },
                components: [
                    { __type__: 'PerspectiveCamera', fov: 50, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100 },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } },
                ],
            },
            // 球体
            {
                __type__: 'Object3D',
                position: { x: -4, y: 2, z: 0 },
                rotation: rot1 = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SphereGeometry', radius: 1.5, segmentsW: 16, segmentsH: 8 },
                    material: normalMat,
                }],
            },
            // 正十二面体
            {
                __type__: 'Object3D',
                position: { x: 0, y: 2, z: 0 },
                rotation: rot2 = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'DodecahedronGeometry', radius: 1.5 },
                    material: normalMat,
                }],
            },
            // 圆环结
            {
                __type__: 'Object3D',
                position: { x: 4, y: 2, z: 0 },
                rotation: rot3 = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'TorusKnotGeometry', radius: 0.8, tube: 0.3 },
                    material: normalMat,
                }],
            },
            // 二十面体
            {
                __type__: 'Object3D',
                position: { x: 0, y: -2, z: 0 },
                rotation: rot4 = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'IcosahedronGeometry', radius: 1.5, detail: 0 },
                    material: normalMat,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);

function animate(): void
{
    const t = Date.now() * 0.001;
    reactive(rot1).y = t * 0.5;
    reactive(rot2).y = t * 0.7;
    reactive(rot3).y = t * 0.3;
    reactive(rot4).y = t * 0.6;

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
