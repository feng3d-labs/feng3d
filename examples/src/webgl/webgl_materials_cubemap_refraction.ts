import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, Scene, StandardMaterial, View, ticker } from 'feng3d';
// TorusKnotGeometry 在 @feng3d/addons，触发 registerLogic 副作用
import '@feng3d/addons';

/**
 * 移植自 three.js examples/webgl_materials_cubemap_refraction.html。
 *
 * 原示例：立方体贴图折射。CubeTextureLoader 加载 Park3Med 6 面 jpg，mapping 设为
 * CubeRefractionMapping，场景背景也是该 cubemap；AmbientLight(0xffffff, 3.5)；
 * PLYLoader 加载 Lucy 模型，克隆 3 份分别用：cubeMaterial1（白色折射 refractionRatio 0.98）、
 * cubeMaterial2（青色折射 refractionRatio 0.985）、cubeMaterial3（浅蓝折射 reflectivity 0.9）；
 * 鼠标移动驱动相机缓动跟随。
 *
 * feng3d 适配（核心能力限制 + 替代方案）：
 * - CubeTexture 加载：feng3d 暂无运行时 CubeTextureLoader（无法加载 6 面 jpg 拼成立方体贴图），
 *   StandardMaterial.s_envMap 默认为 defaultCubeTexture（1×1×6 纯白立方体）。本示例用默认白色
 *   envMap 展示折射→反射管线的近似：白色环境经反射通路采样呈现镜面高光。
 *   待 feng3d 实现运行时 cubemap 加载后，可直接赋值 s_envMap 还原真实环境折射。
 * - 折射（CubeRefractionMapping / refractionRatio）：feng3d StandardMaterial 仅支持反射（reflectVec
 *   采样 envMap），无折射通路，三种折射材质用不同 reflectivity + 漫反射色近似视觉差异（见注释）。
 * - Lucy（PLYLoader）：feng3d 无模型加载器，用 TorusKnotGeometry 替代主体展示反射近似。
 * - MeshPhongMaterial{envMap, refractionRatio} → StandardMaterial{s_envMap, reflectivity}。
 * - AmbientLight(0xffffff, 3.5) → Scene.ambientColor（白色环境补光）。
 * - 鼠标移动相机缓动：保留（mousemove → 相机位置缓动）。
 *
 * 三个主体对应关系（横排）：
 *  - 中：白色反射（cubeMaterial1：refractionRatio 0.98 → 近似 reflectivity 0.9 高反射）
 *  - 左：青色反射（cubeMaterial2：refractionRatio 0.985 → reflectivity 0.7 + 青色漫反射）
 *  - 右：浅蓝混合反射（cubeMaterial3：reflectivity 0.9 refractionRatio 0.98 → reflectivity 0.5）
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
            // 原示例背景为 Park3Med cubemap；feng3d 无运行时 cubemap 加载，用近似森林深绿背景
            background: { __type__: 'Color4', r: 0.08, g: 0.12, b: 0.08, a: 1 },
            // AmbientLight(0xffffff, 3.5)：白色环境补光
            ambientColor: { __type__: 'Color4', r: 0.7, g: 0.7, b: 0.7, a: 1 },
        }],
        children: [
            // 相机：PerspectiveCamera(50, aspect, 1, 100000) position.z=-4000 → 缩放到近距
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 0, z: 12 },
                components: [{
                    __type__: 'PerspectiveCamera',
                    fov: 50,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 0.1,
                    far: 100000,
                }],
            },
            // 中：白色反射（cubeMaterial1：refractionRatio 0.98 → 高反射近似）
            {
                __type__: 'Object3D',
                name: 'knot1',
                position: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'TorusKnotGeometry', radius: 2, tube: 0.6 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            // cubeMaterial1: color 0xffffff envMap refractionRatio 0.98
                            u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 },
                            u_glossiness: 90,
                            // 高反射近似折射的透明感
                            u_reflectivity: 0.9,
                        },
                    } as StandardMaterial,
                }],
            },
            // 左：青色反射（cubeMaterial2：refractionRatio 0.985 → 中反射），position.x=-6
            {
                __type__: 'Object3D',
                name: 'knot2',
                position: { x: -6, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'TorusKnotGeometry', radius: 2, tube: 0.6 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            // cubeMaterial2: color 0xccfffd envMap refractionRatio 0.985
                            u_diffuse: { __type__: 'Color4', r: 0.8, g: 1, b: 0.99, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 },
                            u_glossiness: 60,
                            u_reflectivity: 0.7,
                        },
                    } as StandardMaterial,
                }],
            },
            // 右：浅蓝混合反射（cubeMaterial3：reflectivity 0.9 refractionRatio 0.98），position.x=6
            {
                __type__: 'Object3D',
                name: 'knot3',
                position: { x: 6, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'TorusKnotGeometry', radius: 2, tube: 0.6 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            // cubeMaterial3: color 0xccddff envMap refractionRatio 0.98 reflectivity 0.9
                            u_diffuse: { __type__: 'Color4', r: 0.8, g: 0.87, b: 1, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 },
                            u_glossiness: 50,
                            u_reflectivity: 0.5,
                        },
                    } as StandardMaterial,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
const cameraObj = view.root!.children![0];

// ---- 鼠标缓动相机跟随（对应原 onDocumentMouseMove + render 的缓动逻辑） ----
let targetX = 0;
let targetY = 0;
window.addEventListener('mousemove', (event) =>
{
    targetX = (event.clientX - window.innerWidth / 2) * 0.05;
    targetY = (event.clientY - window.innerHeight / 2) * 0.05;
});

ticker.onframe(() =>
{
    // 相机缓动跟随鼠标（原 render: position.x += (mouseX - position.x)*0.05）
    const cur = logic(cameraObj).position;
    const nx = cur.x + (targetX - cur.x) * 0.05;
    const ny = cur.y + (-targetY - cur.y) * 0.05;
    reactive(cameraObj).position = { x: nx, y: ny, z: 12 };
    webgpu.submit(viewLogic.submit);
});
