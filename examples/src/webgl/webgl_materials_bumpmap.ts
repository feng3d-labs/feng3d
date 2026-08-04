import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromUrl, logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';

/**
 * 凹凸贴图（Bump Map）展示。
 *
 * 对照 three.js：examples/webgl_materials_bumpmap.html
 * 原示例用 LeePerrySmith 头模 + bumpMap + SpotLight，feng3d 用 Sphere + 法线贴图近似
 * （StandardMaterial.s_normal 已支持切线空间法线）。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const normalTex = await createTextureFromUrl('/trinket_normal.jpg');
const diffuseTex = await createTextureFromUrl('/crate.gif');

let sphereRot: { readonly x: number; readonly y: number; readonly z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.03, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 3 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 27, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'dirLight', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] },
            { __type__: 'Object3D', name: 'spotLight', position: { x: -2, y: 3, z: 2 },
              components: [{ __type__: 'SpotLight', color: { __type__: 'Color3', r: 1, g: 0.9, b: 0.8 }, intensity: 20, range: 50, angle: 30, penumbra: 0.5 }] },
            { __type__: 'Object3D', name: 'sphere', rotation: sphereRot = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SphereGeometry', radius: 1, segmentsW: 128, segmentsH: 64 },
                material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, u_specular: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 }, u_glossiness: 40, u_reflectivity: 0 },
                    s_diffuse: diffuseTex as unknown as StandardMaterial['s_diffuse'], s_normal: normalTex as unknown as StandardMaterial['s_normal'] } }] },
        ],
    },
};

const viewLogic = logic(view);
const spotNode = view.root!.children![2];
const startTime = Date.now();
ticker.onframe(() =>
{
    const t = (Date.now() - startTime) * 0.001;
    reactive(spotNode).position = { x: Math.cos(t) * 4, y: 3, z: Math.sin(t) * 4 };
    reactive(sphereRot).y += 0.002;
    webgpu.submit(viewLogic.submit);
});
