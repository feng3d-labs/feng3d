import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, Scene, StandardMaterial, View, ticker } from 'feng3d';
// TorusKnotGeometry 在 @feng3d/addons，触发 registerLogic 副作用
import '@feng3d/addons';

/**
 * 移植自 three.js examples/webgl_lights_hemisphere.html。
 *
 * 原示例：HemisphereLight(天蓝色 0x3352a6 顶色, 棕色 0x996633 底色, 强度 2) 环境补光 +
 * DirectionalLight(0xfff4e6, 3) 投射阴影，照在 Flamingo（GLTF 模型）+ 地面上；
 * 自定义 ShaderMaterial 渐变天空穹；OrbitControls 漫游；阴影强度 GUI。
 *
 * feng3d 适配：
 * - HemisphereLight（半球光）：feng3d 无半球光组件，用 Scene.ambientColor（中间色调）替代，
 *   近似顶/底色混合后的环境补光。天空穹 ShaderMaterial 同样无对应，用 Scene.background 纯色。
 * - DirectionalLight：直接用，castShadows 默认开启，由 ShadowRenderer 投射方向光阴影。
 * - Flamingo（GLTFLoader）：feng3d 无模型加载器，用 TorusKnotGeometry 替代主体展示光照+阴影。
 * - MeshLambertMaterial → StandardMaterial（glossiness 0 = 漫反射为主，reflectivity 0 关闭环境反射）。
 * - 地板：PlaneGeometry receiveShadows；主体 castShadows + receiveShadows。
 * - OrbitControls：作为相机组件，左键旋转、滚轮缩放、右键平移。
 * - GUI/Helper/Stats/天空穹：省略。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            // HemisphereLight(天蓝 0x3352a6, 棕 0x996633, 2) 的近似：
            // 顶/底色混合后的中间色调作环境补光
            background: { __type__: 'Color4', r: 0.6, g: 0.7, b: 0.85, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.5, g: 0.45, b: 0.4, a: 1 },
        }],
        children: [
            // 相机：PerspectiveCamera(30, aspect, 1, 5000) position(0,0,250)
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 0, z: 250 },
                components: [
                    { __type__: 'PerspectiveCamera', fov: 30, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 5000 },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } },
                ],
            },
            // DirectionalLight(0xfff4e6, 3)：position(-30,52.5,30)，投射阴影
            {
                __type__: 'Object3D',
                name: 'DirectionalLight',
                position: { x: -30, y: 52.5, z: 30 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 0.957, b: 0.902 },
                    intensity: 3,
                }],
            },
            // 地板：PlaneGeometry(10000,10000) yUp 朝上，position.y=-33，receiveShadow
            {
                __type__: 'Object3D',
                name: 'ground',
                position: { x: 0, y: -33, z: 0 },
                // PlaneGeometry 默认在 XY 平面，绕 X 轴 -90° 朝上
                rotation: { x: -Math.PI / 2, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'PlaneGeometry', width: 10000, height: 10000 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            // 棕色地面（HSL(0.095,1,0.75) ≈ 0xfff2c9 → 暖白）
                            u_diffuse: { __type__: 'Color4', r: 0.91, g: 0.86, b: 0.69, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0,
                            u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                    castShadows: false,
                    receiveShadows: true,
                }],
            },
            // 主体：TorusKnot（替代 Flamingo 模型），castShadow + receiveShadow
            {
                __type__: 'Object3D',
                name: 'knot',
                position: { x: 0, y: 15, z: 0 },
                rotation: { x: 0, y: -1, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'TorusKnotGeometry', radius: 30, tube: 10 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0,
                            u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                    castShadows: true,
                    receiveShadows: true,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
