import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromUrl, logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';

/**
 * 法线贴图（Normal Map）展示。
 *
 * 对照 three.js：examples/webgl_materials_normalmap.html
 *
 * 原示例：Lee Perry-Smith 头模 + MeshPhongMaterial{normalMap, specularMap, shininess}，
 * 方向光 + 点光源旋转，GUI 切换 normalMap 开关。后处理链（BleachBypass/FXAA）省略。
 *
 * feng3d 适配：
 * - 头模（GLB）→ SphereGeometry（高细分，让法线贴图凹凸可见）
 * - MeshPhongMaterial{normalMap} → StandardMaterial{s_normal}（库已支持切线空间法线采样）
 * - specularMap → s_specular（库已支持）
 * - 点光源旋转动画 + OrbitControls
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 加载纹理（用现有资源替代 LeePerrySmith 贴图）
const diffuseMap = await createTextureFromUrl('/crate.gif');
const normalMap = await createTextureFromUrl('/trinket_normal.jpg');

let sphereRot: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 3 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [
                    {
                        __type__: 'PerspectiveCamera', fov: 45,
                        aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100,
                    },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } },
                ],
            },
            // 方向光（主光源）
            {
                __type__: 'Object3D', name: 'dirLight', position: { x: 1, y: 1, z: 1 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 1,
                }],
            },
            // 旋转的点光源（对应原示例 pointLight 圆周运动）
            {
                __type__: 'Object3D', name: 'pointLight',
                position: { x: 2, y: 0, z: 0 },
                components: [{
                    __type__: 'PointLight',
                    color: { __type__: 'Color3', r: 0.5, g: 0.7, b: 1 },
                    intensity: 5,
                    range: 10,
                }],
            },
            // 带法线贴图的球体（高细分，旋转动画）
            {
                __type__: 'Object3D', name: 'sphere',
                rotation: sphereRot = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SphereGeometry', radius: 1, segmentsW: 128, segmentsH: 64 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 },
                            u_glossiness: 50, u_reflectivity: 0,
                        },
                        s_diffuse: diffuseMap as unknown as StandardMaterial['s_diffuse'],
                        s_normal: normalMap as unknown as StandardMaterial['s_normal'],
                    },
                }],
            },
        ],
    },
};

const viewLogic = logic(view);

const pointLightNode = view.root!.children![2];
const startTime = Date.now();

ticker.onframe(() =>
{
    // 点光源圆周运动
    const t = (Date.now() - startTime) * 0.001;
    reactive(pointLightNode).position = {
        x: Math.cos(t) * 3,
        y: Math.sin(t * 0.7) * 1.5,
        z: Math.sin(t) * 3,
    };

    // 球体自转
    reactive(sphereRot).y += 0.002;

    webgpu.submit(viewLogic.submit);
});
