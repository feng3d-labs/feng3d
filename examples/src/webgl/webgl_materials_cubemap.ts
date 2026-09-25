import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, Scene, StandardMaterial, View, ticker } from 'feng3d';
// TorusKnotGeometry 在 @feng3d/addons，触发 registerLogic 副作用
import '@feng3d/addons';

/**
 * 移植自 three.js examples/webgl_materials_cubemap.html。
 *
 * 原示例：立方体贴图反射。CubeTextureLoader 加载 SwedishRoyalCastle 6 面 jpg 作 envMap（场景背景
 * 也是该 cubemap）；AmbientLight(0xffffff, 3) + PointLight(0xffffff, 200)；OBJLoader 加载 3 个 WaltHead
 * 模型，分别用：cubeMaterial1（白色反射 envMap）、cubeMaterial2（黄色折射 refractionRatio 0.95）、
 * cubeMaterial3（橙色混合反射 reflectivity 0.3）；OrbitControls（禁缩放/平移，限制极角）。
 *
 * feng3d 适配（核心能力限制 + 替代方案）：
 * - CubeTexture 加载：feng3d 暂无运行时 CubeTextureLoader（无法加载 6 面 jpg 拼成立方体贴图），
 *   StandardMaterial.s_envMap 默认为 defaultCubeTexture（1×1×6 纯白立方体）。因此本示例用默认白色
 *   envMap 展示反射管线：白色环境被反射到高 reflectivity 球面，呈现镜面高光效果。
 *   待 feng3d 实现运行时 cubemap 加载后，可直接赋值 s_envMap 还原真实环境反射。
 * - 折射（MeshLambertMaterial refractionRatio）：feng3d StandardMaterial 仅支持反射（reflectVec 采样
 *   envMap），无折射通路，cubeMaterial2 用纯色漫反射近似（说明见注释）。
 * - WaltHead（OBJLoader）：feng3d 无模型加载器，用 TorusKnotGeometry + SphereGeometry 替代主体展示反射。
 * - MeshLambertMaterial{envMap} → StandardMaterial{s_envMap}：reflectivity 控制反射强度。
 * - AmbientLight(0xffffff, 3) → Scene.ambientColor（白色环境补光）。
 * - OrbitControls：作为相机组件（禁缩放/平移/极角限制暂不支持，仅基础环绕）。
 * - Stats：省略。
 *
 * 三个主体对应关系（横排）：
 *  - 中：白色高反射球（cubeMaterial1：envMap 反射，reflectivity 1）
 *  - 左：黄色漫反射球（cubeMaterial2 折射的近似：低 reflectivity、纯黄漫反射）
 *  - 右：橙色混合反射球（cubeMaterial3：envMap 反射，reflectivity 0.3）
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
            // 原示例背景为 SwedishRoyalCastle cubemap；feng3d 无运行时 cubemap 加载，用近似深色背景
            background: { __type__: 'Color4', r: 0.15, g: 0.15, b: 0.18, a: 1 },
            // AmbientLight(0xffffff, 3)：白色环境补光
            ambientColor: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 },
        }],
        children: [
            // 相机：PerspectiveCamera(50, aspect, 0.1, 100) position.z=13
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 0, z: 13 },
                components: [
                    { __type__: 'PerspectiveCamera', fov: 50, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100 },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } },
                ],
            },
            // PointLight(0xffffff, 200)：靠近原点的点光源
            {
                __type__: 'Object3D',
                name: 'PointLight',
                position: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'PointLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 15,
                    range: 100,
                }],
            },
            // 中：白色高反射球（cubeMaterial1：envMap 反射），SphereGeometry r=2.5
            {
                __type__: 'Object3D',
                name: 'sphere1',
                position: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SphereGeometry', radius: 2.5, segmentsW: 64, segmentsH: 32 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            // cubeMaterial1: color 0xffffff envMap reflectionCube
                            u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 },
                            u_glossiness: 80,
                            // 反射强度 1：环境贴图（默认白色）完全反射
                            u_reflectivity: 1,
                        },
                    } as StandardMaterial,
                }],
            },
            // 左：黄色漫反射球（cubeMaterial2 折射的近似），position.x=-6
            {
                __type__: 'Object3D',
                name: 'sphere2',
                position: { x: -6, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SphereGeometry', radius: 2.5, segmentsW: 64, segmentsH: 32 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            // cubeMaterial2: color 0xfff700 envMap refractionCube refractionRatio 0.95
                            // feng3d 无折射通路，用纯黄漫反射 + 极低反射近似透明折射的视觉效果
                            u_diffuse: { __type__: 'Color4', r: 1, g: 0.969, b: 0, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0,
                            u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                }],
            },
            // 右：橙色混合反射球（cubeMaterial3：envMap 反射 reflectivity 0.3），position.x=6
            {
                __type__: 'Object3D',
                name: 'sphere3',
                position: { x: 6, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SphereGeometry', radius: 2.5, segmentsW: 64, segmentsH: 32 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            // cubeMaterial3: color 0xffaa00 envMap reflectionCube combine Mix reflectivity 0.3
                            u_diffuse: { __type__: 'Color4', r: 1, g: 0.667, b: 0, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.2, a: 1 },
                            u_glossiness: 40,
                            // 反射强度 0.3：漫反射与反射混合
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
