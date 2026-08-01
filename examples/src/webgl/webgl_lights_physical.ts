import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_lights_physical.html。
 *
 * 原示例：物理白炽灯泡演示。PointLight(0xffee88, decay=2, castShadow) 模拟灯泡，
 * 上下浮动；HemisphereLight(0xddeeff, 0x0f0e0d, 0.02) 微弱环境光；地板（ hardwood 木纹）
 * + 球（地球贴图，金属度 1）+ 3 个砖块立方体；OrbitControls；Reinhard 色调映射；GUI 调灯泡功率。
 *
 * feng3d 适配：
 * - PointLight：直接用（color 0xffee88, intensity, range=100, castShadows 开启）。
 *   feng3d 用线性距离衰减，intensity 数值与 three.js 不同，按可见效果取值。
 *   灯泡位置随帧浮动（bulbLight.position.y = cos(time)*0.75 + 1.25）。
 * - HemisphereLight(0xddeeff, 0x0f0e0d, 0.02)：用极弱的 Scene.ambientColor 替代。
 * - Reinhard 色调映射：feng3d 无色调映射管线，省略（直接线性输出）。
 * - 贴图（hardwood/brick/earth）：feng3d 有 createTextureFromUrl，但 three.js 示例资源不在本仓库，
 *   用纯色 StandardMaterial 近似：地板白、砖块红棕、球体深蓝（金属感）。
 * - MeshStandardMaterial（PBR）→ StandardMaterial（glossiness/reflectivity 近似）：
 *   地板粗糙（glossiness 低、reflectivity 低）、球体金属（reflectivity 高、glossiness 高）。
 * - 阴影：PointLight 阴影（feng3d ShadowRenderer 支持 PointLight depth cubemap 6 面）。
 * - OrbitControls：作为相机组件。
 * - GUI/Stats：省略。
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
            background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
            // HemisphereLight(0xddeeff, 0x0f0e0d, 0.02)：极弱环境光补光
            ambientColor: { __type__: 'Color4', r: 0.05, g: 0.05, b: 0.05, a: 1 },
        }],
        children: [
            // 相机：PerspectiveCamera(50, aspect, 0.1, 100) position(-4, 2, 4)
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: -4, y: 2, z: 4 },
                components: [
                    { __type__: 'PerspectiveCamera', fov: 50, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100 },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } },
                ],
            },
            // PointLight(0xffee88, decay=2, castShadow)：position(0,2,0)，上下浮动
            {
                __type__: 'Object3D',
                name: 'bulbLight',
                position: { x: 0, y: 2, z: 0 },
                components: [{
                    __type__: 'PointLight',
                    color: { __type__: 'Color3', r: 1, g: 0.933, b: 0.533 },
                    intensity: 8,
                    range: 100,
                }],
            },
            // 地板：PlaneGeometry(20,20) yUp 朝上，receiveShadow（hardwood 木纹 → 近似暖棕）
            {
                __type__: 'Object3D',
                name: 'floor',
                position: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'PlaneGeometry', width: 20, height: 20, yUp: true },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0.55, g: 0.35, b: 0.18, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.2, a: 1 },
                            u_glossiness: 5,
                            u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                    castShadows: false,
                    receiveShadows: true,
                }],
            },
            // 球（earth 贴图金属度 1 → 近似深蓝高光），position(1,0.25,1)
            {
                __type__: 'Object3D',
                name: 'ball',
                position: { x: 1, y: 0.25, z: 1 },
                rotation: { x: 0, y: Math.PI, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SphereGeometry', radius: 0.25, segmentsW: 32, segmentsH: 32 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0.15, g: 0.3, b: 0.6, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 },
                            u_glossiness: 60,
                            u_reflectivity: 0.8,
                        },
                    } as StandardMaterial,
                    castShadows: true,
                    receiveShadows: false,
                }],
            },
            // 砖块立方体 1：position(-0.5, 0.25, -1)
            {
                __type__: 'Object3D',
                name: 'box1',
                position: { x: -0.5, y: 0.25, z: -1 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CubeGeometry', width: 0.5, height: 0.5, depth: 0.5 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0.6, g: 0.3, b: 0.2, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 },
                            u_glossiness: 10,
                            u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                    castShadows: true,
                    receiveShadows: false,
                }],
            },
            // 砖块立方体 2：position(0, 0.25, -5)
            {
                __type__: 'Object3D',
                name: 'box2',
                position: { x: 0, y: 0.25, z: -5 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CubeGeometry', width: 0.5, height: 0.5, depth: 0.5 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0.6, g: 0.3, b: 0.2, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 },
                            u_glossiness: 10,
                            u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                    castShadows: true,
                    receiveShadows: false,
                }],
            },
            // 砖块立方体 3：position(7, 0.25, 0)
            {
                __type__: 'Object3D',
                name: 'box3',
                position: { x: 7, y: 0.25, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CubeGeometry', width: 0.5, height: 0.5, depth: 0.5 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0.6, g: 0.3, b: 0.2, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 },
                            u_glossiness: 10,
                            u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                    castShadows: true,
                    receiveShadows: false,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
// PointLight 随帧浮动（对应原 animate 的 bulbLight.position.y = cos(time)*0.75 + 1.25）
const bulbLightObj = view.root!.children![1];

ticker.onframe(() =>
{
    const time = Date.now() * 0.0005;
    const ny = Math.cos(time) * 0.75 + 1.25;
    const r_bulb = reactive(bulbLightObj);
    r_bulb.position = { x: 0, y: ny, z: 0 };
    webgpu.submit(viewLogic.submit);
});
