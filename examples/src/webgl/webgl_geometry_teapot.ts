import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, Scene, StandardMaterial, View, ticker } from 'feng3d';
// TorusKnotGeometry 在 @feng3d/addons，触发 registerLogic 副作用
import '@feng3d/addons';

/**
 * 移植自 three.js examples/webgl_geometry_teapot.html。
 *
 * 原示例：Utah 茶壶。TeapotGeometry(size=300, tessellation=15) 展示 Utah 茶壶；
 * AmbientLight(0x7c7c7c, 2) + DirectionalLight(0xffffff, 2) position(0.32,0.39,0.7)；
 * GUI 切换 6 种着色（wireframe/flat/smooth/glossy/textured/reflective）；OrbitControls；
 * reflective 模式背景切到 pisa cubemap。
 *
 * feng3d 适配（核心能力缺失 + 替代方案）：
 * - TeapotGeometry：feng3d 无 TeapotGeometry（Utah 茶壶参数曲面几何），改用 TorusKnotGeometry
 *   （环面纽结，同为参数曲面、能展示光照与材质细节）作主体展示。同时加一个 SphereGeometry
 *   辅助对比。待 feng3d 实现 TeapotGeometry 后可直接替换。
 * - AmbientLight(0x7c7c7c, 2) → Scene.ambientColor（灰色环境补光）。
 * - DirectionalLight(0xffffff, 2) position(0.32,0.39,0.7)：直接用。
 * - 6 种着色（GUI 切换）：feng3d 无 GUI，用单个 glossy 材质展示（MeshPhongMaterial{specular,
 *   shininess:300} → StandardMaterial 高 glossiness + 高光色）。
 * - MeshPhongMaterial{flatShading} → StandardMaterial（feng3d 当前为光滑法线，flat 省略）。
 * - reflective 模式（envMap pisa cubemap 背景）：feng3d 无运行时 cubemap 加载，s_envMap 默认白色
 *   立方体，reflectivity 设中值展示反射通路。
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
            // 原示例 scene.background = 0xAAAAAA（reflective 模式才切 cubemap）
            background: { __type__: 'Color4', r: 0.667, g: 0.667, b: 0.667, a: 1 },
            // AmbientLight(0x7c7c7c, 2)：灰色环境补光
            ambientColor: { __type__: 'Color4', r: 0.486, g: 0.486, b: 0.486, a: 1 },
        }],
        children: [
            // 相机：PerspectiveCamera(45, aspect, 1, 80000) position(-600,550,1300)
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: -600, y: 550, z: 1300 },
                components: [
                    { __type__: 'PerspectiveCamera', fov: 45, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 80000 },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } },
                ],
            },
            // DirectionalLight(0xffffff, 2) position(0.32,0.39,0.7)*大值
            {
                __type__: 'Object3D',
                name: 'DirectionalLight',
                position: { x: 320, y: 390, z: 700 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 2,
                }],
            },
            // 主体：TorusKnot（替代 Utah 茶壶），glossy 着色
            // MeshPhongMaterial{color:0xc0c0c0, specular:0x404040, shininess:300}
            {
                __type__: 'Object3D',
                name: 'teapot-substitute',
                position: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'TorusKnotGeometry', radius: 200, tube: 60 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            // glossy: color 0xc0c0c0 specular 0x404040 shininess 300
                            u_diffuse: { __type__: 'Color4', r: 0.753, g: 0.753, b: 0.753, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0.251, g: 0.251, b: 0.251, a: 1 },
                            // shininess 300 → glossiness 高（镜面高光锐利）
                            u_glossiness: 90,
                            // reflective 模式的近似：envMap（默认白色）反射，中强度
                            u_reflectivity: 0.3,
                        },
                    } as StandardMaterial,
                }],
            },
            // 辅助球：SphereGeometry，展示 glossy 着色在球面的高光分布（错开位置避免与主体重叠）
            {
                __type__: 'Object3D',
                name: 'sphere',
                position: { x: -900, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SphereGeometry', radius: 280, segmentsW: 64, segmentsH: 32 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0.753, g: 0.753, b: 0.753, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0.251, g: 0.251, b: 0.251, a: 1 },
                            u_glossiness: 90,
                            u_reflectivity: 0.3,
                        },
                    } as StandardMaterial,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
