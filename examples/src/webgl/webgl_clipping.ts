import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromUrl, logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';
import type { TorusKnotGeometry } from '@feng3d/addons';
import '@feng3d/addons';

/**
 * TorusKnot + 光照展示。
 *
 * 对照 three.js：examples/webgl_clipping.html
 * 原示例演示 clippingPlanes 剖切，feng3d 暂不支持剖切，保留 TorusKnot + 多光源场景。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const crateTex = await createTextureFromUrl('/crate.gif');

let knotRot: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 8 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'PerspectiveCamera', fov: 50,
                    aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100,
                },
                { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }],
            },
            { __type__: 'Object3D', name: 'dirLight', position: { x: 1, y: 1, z: 1 },
              components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] },
            {
                __type__: 'Object3D', name: 'pointLight', position: { x: 3, y: 0, z: 0 },
                components: [{ __type__: 'PointLight', color: { __type__: 'Color3', r: 0, g: 0.5, b: 1 }, intensity: 10, range: 20 }],
            },
            {
                __type__: 'Object3D', name: 'knot',
                rotation: knotRot = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'TorusKnotGeometry', radius: 1.5, tubeRadius: 0.5, segmentsR: 100, segmentsT: 16 } as unknown as TorusKnotGeometry,
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 },
                            u_glossiness: 80, u_reflectivity: 0,
                        },
                        s_diffuse: crateTex as unknown as StandardMaterial['s_diffuse'],
                    },
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
const lightNode = view.root!.children![2];
const startTime = Date.now();

ticker.onframe(() =>
{
    reactive(knotRot).y += 0.005;
    reactive(knotRot).x += 0.003;
    const t = (Date.now() - startTime) * 0.001;
    reactive(lightNode).position = { x: Math.cos(t) * 4, y: Math.sin(t * 0.7) * 2, z: Math.sin(t) * 4 };
    webgpu.submit(viewLogic.submit);
});
