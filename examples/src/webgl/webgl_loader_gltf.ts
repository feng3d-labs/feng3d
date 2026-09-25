import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, View, ticker } from 'feng3d';
import { loadGLFFromUrl } from '@feng3d/addons';

/**
 * 展示 GLTFLoader（简化版）：加载 collision-world.glb，旋转展示。
 *
 * 支持：GLB 二进制格式、静态网格（POSITION/NORMAL/TEXCOORD_0 + indices）、场景图节点层级。
 * 不支持：材质/纹理、动画、骨骼/蒙皮、Draco 压缩。
 *
 * 对照 three.js：examples/webgl_loader_gltf.html（使用相同模型 collision-world.glb）。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const { root } = await loadGLFFromUrl('/collision-world.glb');

// 原始模型 node 平移 [7.68, -5.59, 26.38]、缩放 0.5，
// 应用后包围盒中心约 (18, -2.6, 36.6)。平移到便于观察的位置。
const modelCenter = { x: 18, y: -2, z: 36 };

// 旋转动画节点
let modelRot: { readonly x: number; readonly y: number; readonly z: number };
const rotNode: Object3D = {
    __type__: 'Object3D',
    name: 'modelRotator',
    rotation: modelRot = { x: 0, y: 0, z: 0 },
    children: [root],
};

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: modelCenter.x, y: modelCenter.y, z: modelCenter.z + 45 },
                components: [
                    { __type__: 'PerspectiveCamera', fov: 45, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 1000 },
                    { __type__: 'OrbitControls', target: modelCenter },
                ],
            },
            {
                __type__: 'Object3D', name: 'dirLight', position: { x: 0.5, y: 1, z: 0.5 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 3,
                }],
            },
            rotNode,
        ],
    },
};

const viewLogic = logic(view);
ticker.onframe(() =>
{
    reactive(modelRot).y += 0.003;
    webgpu.submit(viewLogic.submit);
});
