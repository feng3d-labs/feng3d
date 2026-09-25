import { WebGPU } from '@feng3d/webgpu';
import { logic, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';
import { loadPLYFromUrl } from '@feng3d/addons';

/**
 * 展示 PLYLoader：加载 dolphins.ply（ASCII PLY，海豚模型），旋转展示。
 *
 * 模型坐标范围约 800 单位，整体 scale 0.01 缩放至单位量级，相机距离适配。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const geometry = await loadPLYFromUrl('/dolphins.ply');

let meshRot: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.05, g: 0.05, b: 0.05, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: -2, z: 6 },
                components: [
                    { __type__: 'PerspectiveCamera', fov: 45, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.01, far: 100 },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } },
                ],
            },
            { __type__: 'Object3D', name: 'dirLight', position: { x: 1, y: 1, z: 1 },
              components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 3 }] },
            {
                __type__: 'Object3D', name: 'mesh', scale: { x: 0.01, y: 0.01, z: 0.01 }, rotation: meshRot = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer', geometry,
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 },
                            u_glossiness: 30, u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
ticker.onframe(() =>
{
    reactive(meshRot).z += 0.005;
    webgpu.submit(viewLogic.submit);
});
