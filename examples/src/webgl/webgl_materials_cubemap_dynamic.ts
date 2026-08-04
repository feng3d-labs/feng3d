import { WebGPU } from '@feng3d/webgpu';
import { createTextureCubeFromUrls, logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';

/**
 * 环境贴图反射（静态 envMap，对照动态 CubeCamera）。
 *
 * 对照 three.js：examples/webgl_materials_cubemap_dynamic.html
 * 原示例用 CubeCamera 实时反射，feng3d 用静态 SkyBox 环境贴图近似。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const envTex = await createTextureCubeFromUrls([
    '/skybox/px.jpg', '/skybox/py.jpg', '/skybox/pz.jpg',
    '/skybox/nx.jpg', '/skybox/ny.jpg', '/skybox/nz.jpg',
]);

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
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 5 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'PerspectiveCamera', fov: 50,
                    aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100,
                },
                { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, autoRotate: true, autoRotateSpeed: 1 }],
            },
            { __type__: 'Object3D', name: 'dirLight', position: { x: 1, y: 1, z: 1 },
              components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 0.5 }] },
            // 反射球
            {
                __type__: 'Object3D', name: 'mirrorSphere',
                rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SphereGeometry', radius: 1.5, segmentsW: 64, segmentsH: 32 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 },
                            u_glossiness: 100, u_reflectivity: 0.9,
                        },
                        s_envMap: envTex as unknown as StandardMaterial['s_envMap'],
                    },
                }],
            },
            // 旁边两个小球
            {
                __type__: 'Object3D', name: 'sphere2', position: { x: 3, y: 1, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SphereGeometry', radius: 0.6, segmentsW: 32, segmentsH: 16 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: { u_diffuse: { __type__: 'Color4', r: 1, g: 0.5, b: 0.2, a: 1 }, u_specular: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 }, u_glossiness: 50, u_reflectivity: 0.3 },
                        s_envMap: envTex as unknown as StandardMaterial['s_envMap'],
                    },
                }],
            },
            {
                __type__: 'Object3D', name: 'sphere3', position: { x: -3, y: -1, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SphereGeometry', radius: 0.6, segmentsW: 32, segmentsH: 16 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: { u_diffuse: { __type__: 'Color4', r: 0.2, g: 0.8, b: 1, a: 1 }, u_specular: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 }, u_glossiness: 50, u_reflectivity: 0.3 },
                        s_envMap: envTex as unknown as StandardMaterial['s_envMap'],
                    },
                }],
            },
            // SkyBox 背景
            { __type__: 'Object3D', name: 'skybox',
              components: [{ __type__: 'SkyBox', s_skyboxTexture: envTex as unknown as never }] },
        ],
    },
};

const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
