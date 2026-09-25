import { WebGPU } from '@feng3d/webgpu';
import {
    createTextureCubeFromUrls, logic, Object3D,
    reactive, Scene, StandardMaterial, View, ticker,
} from 'feng3d';

/**
 * 环境贴图反射：金属球体反射 skybox 环境。
 *
 * 对照 three.js：examples/webgl_materials_envmaps.html
 *
 * 原示例用 MeshBasicMaterial({ envMap }) 或 MeshPhongMaterial({ envMap }) 展示
 * Cube/Equirect 环境贴图反射，高细分二十面体表面映射环境。
 *
 * feng3d 适配：
 * - CubeTextureLoader → createTextureCubeFromUrls（6 面 skybox）
 * - material.envMap → StandardMaterial.s_envMap（库已支持 cube 采样 + reflectVec）
 * - u_reflectivity 控制反射强度（0=无反射，1=纯镜面反射）
 * - 高细分球体 + 光照 + 环境反射
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 加载 skybox 作为环境贴图（6 面）
const envTexture = await createTextureCubeFromUrls([
    '/skybox/px.jpg',
    '/skybox/py.jpg',
    '/skybox/pz.jpg',
    '/skybox/nx.jpg',
    '/skybox/ny.jpg',
    '/skybox/nz.jpg',
]);

// 旋转状态
let sphereRot: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 5 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [
                    {
                        __type__: 'PerspectiveCamera', fov: 50,
                        aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 1000,
                    },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } },
                ],
            },
            // 方向光
            {
                __type__: 'Object3D', name: 'dirLight', position: { x: 1, y: 1, z: 1 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 1,
                }],
            },
            // 反射球体（高细分，金属感）
            {
                __type__: 'Object3D', name: 'mirrorSphere',
                rotation: sphereRot = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SphereGeometry', radius: 1.5, segmentsW: 64, segmentsH: 32 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 },
                            u_glossiness: 60,
                            // envmapMethod 把 finalColor *= envColor*u_reflectivity，
                            // 这里用 1.0 让环境色完全参与（接近金属反射外观）
                            u_reflectivity: 1.0,
                        },
                        s_envMap: envTexture as unknown as StandardMaterial['s_envMap'],
                    },
                }],
            },
            // 背景天空盒（用 SkyBox 组件显示环境）
            {
                __type__: 'Object3D', name: 'skybox',
                components: [{
                    __type__: 'SkyBox',
                    s_skyboxTexture: envTexture as unknown as never,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);

ticker.onframe(() =>
{
    reactive(sphereRot).y += 0.003;
    webgpu.submit(viewLogic.submit);
});
