import { WebGPU } from '@feng3d/webgpu';
import { createTextureCubeFromUrls, logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';

/**
 * SkyBox + 反射球群（立体视觉简化版）。
 *
 * 对照 three.js：examples/webgl_effects_anaglyph.html
 * 原示例用 AnaglyphEffect 红蓝立体，feng3d 无此特效，保留 SkyBox + 球群场景。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const envTex = await createTextureCubeFromUrls([
    '/skybox/px.jpg', '/skybox/py.jpg', '/skybox/pz.jpg',
    '/skybox/nx.jpg', '/skybox/ny.jpg', '/skybox/nz.jpg',
]);

// 球群
const spheres: Object3D[] = [];
for (let i = 0; i < 30; i++)
{
    const angle = (i / 30) * Math.PI * 2;
    const r = 3 + (i % 5) * 0.8;
    const hue = i / 30;
    const [cr, cg, cb] = [Math.sin(hue * 6.28) * 0.3 + 0.7, Math.sin(hue * 6.28 + 2.1) * 0.3 + 0.7, Math.sin(hue * 6.28 + 4.2) * 0.3 + 0.7];
    spheres.push({
        __type__: 'Object3D', name: `ball_${i}`,
        position: { x: Math.cos(angle) * r, y: Math.sin(angle * 2) * 2, z: Math.sin(angle) * r },
        rotation: { x: 0, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'SphereGeometry', radius: 0.5 + (i % 3) * 0.2, segmentsW: 32, segmentsH: 16 },
            material: {
                __type__: 'StandardMaterial',
                uniforms: {
                    u_diffuse: { __type__: 'Color4', r: cr * 0.3, g: cg * 0.3, b: cb * 0.3, a: 1 },
                    u_specular: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 },
                    u_glossiness: 80, u_reflectivity: 0.7,
                },
                s_envMap: envTex as unknown as StandardMaterial['s_envMap'],
            },
        }],
    });
}

let groupRot: { x: number; y: number; z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 15 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'PerspectiveCamera', fov: 60,
                    aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 1000,
                },
                { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, autoRotate: true, autoRotateSpeed: 0.5 }],
            },
            { __type__: 'Object3D', name: 'dirLight', position: { x: 1, y: 1, z: 1 },
              components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 0.5 }] },
            { __type__: 'Object3D', name: 'group', rotation: groupRot = { x: 0, y: 0, z: 0 }, children: spheres },
            { __type__: 'Object3D', name: 'skybox',
              components: [{ __type__: 'SkyBox', s_skyboxTexture: envTex as unknown as never }] },
        ],
    },
};

const viewLogic = logic(view);

ticker.onframe(() =>
{
    reactive(groupRot).y += 0.002;
    webgpu.submit(viewLogic.submit);
});
