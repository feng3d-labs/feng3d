import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromCanvas, FogMode, logic, ShadowType, StandardMaterial, ticker, View } from 'feng3d';
import type { Object3D } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_shadowmap.html（1:1 复刻，分阶段推进）。
 *
 * 原示例的"罗马场景"：大地面 + 两个大盒子 + THREE.JS 立体字 + 8 只带骨骼动画的动物，
 * PCF 阴影 + FirstPersonControls 漫游，按 t 切换阴影图 HUD。
 *
 * 当前进度（阶段 B：静态场景）：
 * - 相机 PerspectiveCamera(23, aspect, 10, 3000)，位置 (700, 50, 1900)
 * - 背景 / 雾 0x59472b（Fog 1000 → 3000）
 * - AmbientLight(0xffffff) + DirectionalLight(0xffffff, 3)，位置 (0, 1500, 1000)，朝向原点
 * - 阴影：shadow.camera ±2000 / near 1200 / far 2500、mapSize 2048×1024、bias 0.0001、PCFShadowMap
 * - 地面 PlaneGeometry(100, 100) × scale 100，y = FLOOR(-250)，MeshPhongMaterial(0xffdd99)
 * - 两个大盒子 1500×220×150 / 1600×170×250，y = FLOOR - 50，z = 20，同一 planeMaterial
 *
 * 未做（后续阶段）：C = 4 个 GLB 的 8 只动物（骨骼动画 + 随机色相 + 循环位移）；
 * D = THREE.JS 立体字 / FirstPersonControls / ShadowMapViewer HUD。
 *
 * 色彩：three 在线性空间算光照再编码回 sRGB，这里给 StandardMaterial 开 linearLighting: true
 * 与之对齐；three 的 BRDF_Lambert 带 1/π 而 fengd3 没有，故方向光 intensity 与
 * sceneAmbientColor 都补上 1/π 因子。雾色是**线性**值（混合发生在线性光照结果上）。
 */

/** three.js: SHADOW_MAP_WIDTH / SHADOW_MAP_HEIGHT */
const SHADOW_MAP_WIDTH = 2048;
const SHADOW_MAP_HEIGHT = 1024;

/** three.js: FLOOR = -250 */
const FLOOR = -250;

/** three.js: NEAR = 10, FAR = 3000 */
const NEAR = 10;
const FAR = 3000;

/** three.js: scene.background = scene.fog = 0x59472b */
const FOG_COLOR = 0x59472b;

/** three.js 的 BRDF_Lambert 带 1/π；fengd3 的漫反射没有该因子 */
const INV_PI = 1 / Math.PI;

/** 0xRRGGBB → sRGB Color4（背景与雾色都不做色彩管理；雾在输出空间混合） */
function srgbColor4(hex: number, alpha = 1)
{
    return {
        __type__: 'Color4' as const,
        r: ((hex >> 16) & 0xff) / 255,
        g: ((hex >> 8) & 0xff) / 255,
        b: (hex & 0xff) / 255,
        a: alpha,
    };
}

/**
 * 1×1 镜面颜色纹理（three 的 MeshPhongMaterial 默认 specular 0x111111 → 线性 ≈ 0.0056）。
 *
 * StandardMaterial 的 u_specular 会被 s_specular 纹理覆盖，而该纹理在 linearLighting 下
 * **不**做 sRGB 解码（直接当线性值用），故 8 位取 2/255 ≈ 0.0078 与 0.0056 同量级。
 */
function createSpecularTexture(): ReturnType<typeof createTextureFromCanvas>
{
    const canvas = document.createElement('canvas');

    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d')!;

    context.fillStyle = 'rgb(2, 2, 2)';
    context.fillRect(0, 0, 1, 1);

    return createTextureFromCanvas(canvas);
}

const specularTexture = createSpecularTexture();

/** three.js: planeMaterial = MeshPhongMaterial({ color: 0xffdd99 })（地面与两个大盒子共用） */
const planeMaterial: StandardMaterial = {
    __type__: 'StandardMaterial',
    linearLighting: true,
    uniforms: {
        u_diffuse: srgbColor4(0xffdd99),
        u_glossiness: 30,
        u_reflectivity: 0,
        // three 的 Fog(0x59472b, 1000, 3000)：线性雾（smoothstep），雾在**输出空间**混合，
        // 所以雾色给 sRGB 值（与 three 的 getUnlitUniformColorSpace 行为一致）
        u_fogMode: FogMode.LINEAR,
        u_fogColor: srgbColor4(FOG_COLOR),
        u_fogMinDistance: 1000,
        u_fogMaxDistance: FAR,
    },
    s_specular: specularTexture,
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

/**
 * 主相机（three.js: PerspectiveCamera(23, w/h, 10, 3000).position.set(700, 50, 1900)）。
 *
 * 原示例的 FirstPersonControls 会 `lookAt(scene.position)`，阶段 B 还没有控制器，
 * 先用等价的相机 lookAt 原点；阶段 D 换成 FPSController。
 */
const cameraObject: Object3D = {
    __type__: 'Object3D',
    name: 'Main Camera',
    position: { x: 700, y: 50, z: 1900 },
    components: [{
        __type__: 'PerspectiveCamera',
        fov: 23,
        aspect: webgpuCanvas.width / webgpuCanvas.height,
        near: NEAR,
        far: FAR,
    }],
};

/** 方向光物体（three 的 light 挂在 scene 下，target 默认在原点 → 需要 lookAt 原点） */
const lightObject: Object3D = {
    __type__: 'Object3D',
    name: 'light',
    // three.js: light.position.set(0, 1500, 1000)
    position: { x: 0, y: 1500, z: 1000 },
    components: [{
        __type__: 'DirectionalLight',
        // three.js: DirectionalLight(0xffffff, 3)；补 1/π 因子
        color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
        intensity: 3 * INV_PI,
        // three.js: renderer.shadowMap.type = THREE.PCFShadowMap
        shadowType: ShadowType.PCF_Shadows,
        // three.js: light.shadow.bias = 0.0001
        shadowBias: 0.0001,
        // three.js: light.shadow.radius 默认 1
        shadowRadius: 1,
        // three.js: shadow.camera.left/right/top/bottom = ∓2000/±2000、near 1200、far 2500
        shadowCameraLeft: -2000,
        shadowCameraRight: 2000,
        shadowCameraTop: 2000,
        shadowCameraBottom: -2000,
        shadowCameraNear: 1200,
        shadowCameraFar: 2500,
        // three.js: shadow.mapSize = 2048 × 1024
        shadowMapSize: { x: SHADOW_MAP_WIDTH, y: SHADOW_MAP_HEIGHT },
        debugShadowMap: false,
    }],
};

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            // three.js: scene.background = new Color(0x59472b)
            background: srgbColor4(FOG_COLOR),
            // three.js: AmbientLight(0xffffff) —— 同样补 1/π（BRDF_Lambert）
            ambientColor: { __type__: 'Color4', r: INV_PI, g: INV_PI, b: INV_PI, a: 1 },
        }],
        children: [
            // CAMERA（three.js: PerspectiveCamera(23, w/h, 10, 3000).position.set(700, 50, 1900)）
            cameraObject,
            // LIGHTS
            lightObject,
            // GROUND（three.js: PlaneGeometry(100, 100) + scale 100、rotation.x = -π/2、y = FLOOR）
            {
                __type__: 'Object3D',
                name: 'ground',
                position: { x: 0, y: FLOOR, z: 0 },
                scale: { x: 100, y: 100, z: 100 },
                components: [{
                    __type__: 'MeshRenderer',
                    // fengd3 的 PlaneGeometry 默认 yUp: true（XZ 平面、法线 +Y），
                    // 与 three 的 XY 平面绕 X 轴 -π/2 后朝向一致
                    geometry: { __type__: 'PlaneGeometry', width: 100, height: 100 },
                    material: planeMaterial,
                    castShadows: false,
                    receiveShadows: true,
                }],
            },
            // CUBES（three.js: BoxGeometry(1500, 220, 150) / BoxGeometry(1600, 170, 250)，y = FLOOR - 50、z = 20）
            {
                __type__: 'Object3D',
                name: 'cubes1',
                position: { x: 0, y: FLOOR - 50, z: 20 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CubeGeometry', width: 1500, height: 220, depth: 150 },
                    material: planeMaterial,
                    castShadows: true,
                    receiveShadows: true,
                }],
            },
            {
                __type__: 'Object3D',
                name: 'cubes2',
                position: { x: 0, y: FLOOR - 50, z: 20 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CubeGeometry', width: 1600, height: 170, depth: 250 },
                    material: planeMaterial,
                    castShadows: true,
                    receiveShadows: true,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);

// three.js 的 light.target 默认在原点：让方向光的本地 -Z 指向原点
logic(lightObject).lookAt({ x: 0, y: 0, z: 0 });
// 相机看向原点（等价于原示例 FirstPersonControls.lookAt(scene.position) 的初始朝向）
logic(cameraObject).lookAt({ x: 0, y: 0, z: 0 });

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
