import { WebGPU } from '@feng3d/webgpu';
import { loadGLFFromUrl } from '@feng3d/addons';
import { Font } from '@feng3d/math';
import { createTextureFromCanvas, FogMode, logic, reactive, ShadowType, StandardMaterial, ticker, View } from 'feng3d';
import type { Animation, AnimationClipData, DebugShadowMapMaterial, DirectionalLight, FirstPersonControls, Object3D, PlaneGeometry } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_shadowmap.html（1:1 复刻，分阶段推进）。
 *
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
 * 已做（阶段 D 前半）：FirstPersonControls（lookSpeed 0.0125 / movementSpeed 500 / lookVertical）。
 * 未做：C = 4 个 GLB 的 8 只动物（骨骼动画 + 随机色相 + 循环位移）；
 * D 剩余 = THREE.JS 立体字（需字体资源）/ ShadowMapViewer HUD。
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

/** three.js: PerspectiveCamera(23, ...) */
const CAMERA_FOV = 23;

/** three.js: scene.background = scene.fog = 0x59472b */
const FOG_COLOR = 0x59472b;

/** three.js 的 BRDF_Lambert 带 1/π；fengd3 的漫反射没有该因子 */
const INV_PI = 1 / Math.PI;

/**
 * 随机数来源——原示例用 `random()` 决定动物的初始 x、动画相位与色相偏移。
 *
 * 为了 1:1 复刻，默认**保持与 three 完全相同**（直接用 `random()`）；
 * 但像素回归需要可复现的画面，所以留了一个全局钩子：把 `globalThis.__feng3dRandom`
 * 设成一个确定性函数后，本示例的全部随机取值都走它。
 *
 * e2e 的 `e2e/freeze.ts` 会在冻结前注入一个固定种子的伪随机序列，这样同一构建的截图可复现；
 * 平时打开页面（不注入）时行为与原示例一致。
 */
function random(): number
{
    const injected = (globalThis as { __feng3dRandom?: () => number }).__feng3dRandom;

    return injected ? injected() : Math.random();
}

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
//
// three.js 的 `renderer.setSize(w, h)` 会把 `domElement.width/height` 一起设上；本仓的 WebGPU 封装只有
// `configure`（它按 `canvas.width/height` 决定渲染分辨率），没有人负责这一步。
// 于是 `<canvas>` 保持 HTML 默认的 300×150 属性尺寸、而 CSS 把它显示成整屏（如 800×600），
// 浏览器把渲染结果**非等比拉伸**——实测地平线因此比 three 低 59px（本仓 284 / 47.3%，three 225 / 37.5%），
// 整个场景看起来整体下移；并且相机 aspect 无论用哪一边都只能对齐一个。
// 这里补上 three 的那一步：让属性尺寸与显示尺寸一致。
webgpuCanvas.width = window.innerWidth;
webgpuCanvas.height = window.innerHeight;
const webgpu = await new WebGPU().init();

/**
 * 第一人称控制器（three.js: `new FirstPersonControls(camera, renderer.domElement)`）。
 *
 * 参数逐项对齐原示例：`lookSpeed = 0.0125`、`movementSpeed = 500`、`lookVertical = true`。
 */
const firstPersonControls: FirstPersonControls = {
    __type__: 'FirstPersonControls',
    lookSpeed: 0.0125,
    movementSpeed: 500,
    lookVertical: true,
};

/**
 * 主相机（three.js: PerspectiveCamera(23, w/h, 10, 3000).position.set(700, 50, 1900)）。
 */
const cameraObject: Object3D = {
    __type__: 'Object3D',
    name: 'Main Camera',
    position: { x: 700, y: 50, z: 1900 },
    components: [{
        __type__: 'PerspectiveCamera',
        fov: CAMERA_FOV,
        // three.js: `new PerspectiveCamera(23, window.innerWidth / window.innerHeight, 10, 3000)`。
        //
        // **不能用 `webgpuCanvas.width / height`**：`<canvas>` 的默认尺寸是 300×150，而实际显示尺寸是
        // 之后由 CSS/引擎设定的，于是相机 aspect 会被永久固定成 2.0，与实际画布（如 800×600 = 1.333）不符。
        // 投影矩阵按 2.0 算、却显示在 1.333 的画布上 ⇒ 画面被**非等比缩放**。
        // 实测：地平线因此比 three 低 59px（本仓 284 / 47.3%，three 225 / 37.5%），整个场景看起来整体下移。
        aspect: window.innerWidth / window.innerHeight,
        near: NEAR,
        far: FAR,
    }, firstPersonControls],
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
        // 注意：three 的 0.0001 是针对它 RGBA packed depth 的取值；fengd3 的阴影图是精确
        // depth32float、且按正面渲染，自遮挡需要显式 bias 才能压掉（实测 0.03 起与 three 逐像素一致）
        // three.js: light.shadow.bias = 0.0001。
    //
    // 这里取 0.001 而不是原样照抄：three 的阴影图是 RGBA packed depth，精度低于本仓的 depth32float，
    // 两者需要的 bias 量级本就不同。实测扫描（0.0001 / 0.001 / 0.003 / 0.005 / 0.01 / 0.02 / 0.03）：
    //   0.0001~0.02 —— 影子带亮度 46.3~47.1、自遮挡噪声 0.51~0.75，都在可用区间；
    //   0.03        —— 影子带亮度 51.5、暗像素占比从 59.7% 掉到 56.7%，影子明显变浅（原先就是这个值）。
    // 0.001 的噪声最低（0.52）且影子完整，故选它。
    shadowBias: 0.001,
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

/** 方向光组件（HUD 每帧要读它的 shadowDepthTexture 与 shadowMapSize） */
const lightComponent = lightObject.components![0] as unknown as DirectionalLight;

// ---- ShadowMapViewer HUD（three.js: new ShadowMapViewer(light)，按 t 切换）----
//
// three 的 HUD 是"独立正交场景 + clearDepth 后叠加渲染"在窗口左下角、尺寸为阴影图的 1/4；
// 这里用「挂在相机下的世界空间平面 + DebugShadowMapMaterial」达到同样的屏幕效果：
// 平面放在相机前方 HUD_DISTANCE 处，尺寸/位置按该处视锥截面从**画布像素**换算——
// 屏幕上恒为 SHADOW_MAP_WIDTH/4 × SHADOW_MAP_HEIGHT/4 像素，边距与原示例一致。
//
// 换算必须等画布尺寸确定（脚本执行时 canvas 还是 HTML 的默认 300×150），所以放到每帧的
// layout 里做，只在尺寸变化时写入。

/** three.js: lightShadowMapViewer.position.x = 10（左上角为原点的像素边距） */
const HUD_MARGIN = 10;
/** three.js: size.width = SHADOW_MAP_WIDTH / 4、size.height = SHADOW_MAP_HEIGHT / 4 */
const HUD_WIDTH = SHADOW_MAP_WIDTH / 4;
const HUD_HEIGHT = SHADOW_MAP_HEIGHT / 4;

/**
 * 平面到相机的距离（世界单位）。
 *
 * 必须大于相机的 `near`（10），否则整个平面落在近平面之内被裁掉；取 20 留出余量。
 * 它不会被场景遮挡——DebugShadowMapMaterial 的 pipeline 是 `depthCompare: 'always'`。
 */
const HUD_DISTANCE = 20;

/**
 * HUD 材质：把方向光的 shadowDepthTexture 用 textureLoad 可视化（等价 three 的
 * UnpackDepthRGBAShader；fengd3 的阴影图是 depth32float，不能当普通颜色纹理采）。
 */
const hudMaterial = { __type__: 'DebugShadowMapMaterial' } as DebugShadowMapMaterial;

/** HUD 平面几何（尺寸在 layout 里按画布像素换算后写入） */
const hudGeometry: PlaneGeometry = { __type__: 'PlaneGeometry', width: 1, height: 1, yUp: false };

/** HUD 平面：作为相机的子对象，位置/朝向都在相机空间里（相机移动/转向时自动跟随） */
const hudPlane: Object3D = {
    __type__: 'Object3D',
    name: 'shadowMapViewer',
    position: { x: 0, y: 0, z: -HUD_DISTANCE },
    // fengd3 的 PlaneGeometry 在 yUp: false 时法线朝 -Z，而相机前方正是 -Z；
    // 绕 Y 轴转 180° 让正面朝向相机（否则看到的是镜像的背面）
    rotation: { x: 0, y: Math.PI, z: 0 },
    components: [{
        __type__: 'MeshRenderer',
        geometry: hudGeometry,
        material: hudMaterial,
        castShadows: false,
        receiveShadows: false,
    }],
    // three.js: showHUD 默认 false
    activeSelf: false,
};
reactive(cameraObject).children = [hudPlane];

/** 上次换算用的画布尺寸（只在变化时重算，避免每帧写响应式数据） */
let hudLayoutWidth = 0;
let hudLayoutHeight = 0;

/**
 * 按当前画布像素尺寸把 HUD 换算到相机空间（每帧调用；尺寸未变时直接返回）。
 */
function updateHudLayout(): void
{
    const width = webgpuCanvas.width;
    const height = webgpuCanvas.height;
    if (width <= 0 || height <= 0 || (width === hudLayoutWidth && height === hudLayoutHeight)) return;
    hudLayoutWidth = width;
    hudLayoutHeight = height;

    // z = -HUD_DISTANCE 处视锥截面的世界尺寸
    const viewHeight = 2 * HUD_DISTANCE * Math.tan(CAMERA_FOV * Math.PI / 180 / 2);
    const viewWidth = viewHeight * (width / height);
    // three.js: position.y = SCREEN_HEIGHT - (SHADOW_MAP_HEIGHT / 4) - 10（y 从顶部算）
    const centerX = HUD_MARGIN + HUD_WIDTH / 2;
    const centerY = height - HUD_HEIGHT - HUD_MARGIN + HUD_HEIGHT / 2;

    reactive(hudPlane).position = {
        x: (centerX / width - 0.5) * viewWidth,
        y: (0.5 - centerY / height) * viewHeight,
        z: -HUD_DISTANCE,
    };
    const r_geometry = reactive(hudGeometry);
    r_geometry.width = (HUD_WIDTH / width) * viewWidth;
    r_geometry.height = (HUD_HEIGHT / height) * viewHeight;
}

// ---- 阶段 C：4 个 GLB 的 9 只动物（three.js 的 MORPHS 段）----
//
// 原示例对每个模型 `mesh.clone()`，各自 `clipAction(clip, mesh).setDuration(d).startAt(-d * rand).play()`，
// 并（对马）做一次随机的 `color.offsetHSL(0, ±0.25, ±0.25)` 让每只颜色略有不同。

/**
 * three.js `Color.offsetHSL(h, s, l)` 的等价实现（RGB ↔ HSL）。
 *
 * 原示例只传 `h = 0`（色相不动），s/l 各偏移 `random() * 0.5 - 0.25`，
 * 并按 three 的 `setHSL` 把 s/l 夹到 [0, 1]。
 */
function offsetHSL(color: { r: number; g: number; b: number }, h: number, s: number, l: number): void
{
    const max = Math.max(color.r, color.g, color.b);
    const min = Math.min(color.r, color.g, color.b);
    const lightness = (max + min) / 2;
    const d = max - min;
    let hue = 0;
    let saturation = 0;

    if (d !== 0)
    {
        saturation = lightness > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === color.r) hue = (color.g - color.b) / d + (color.g < color.b ? 6 : 0);
        else if (max === color.g) hue = (color.b - color.r) / d + 2;
        else hue = (color.r - color.g) / d + 4;
        hue /= 6;
    }

    const newHue = ((hue + h) % 1 + 1) % 1;
    const newSaturation = Math.min(1, Math.max(0, saturation + s));
    const newLightness = Math.min(1, Math.max(0, lightness + l));

    if (newSaturation === 0)
    {
        color.r = newLightness;
        color.g = newLightness;
        color.b = newLightness;

        return;
    }

    const q = newLightness < 0.5 ? newLightness * (1 + newSaturation) : newLightness + newSaturation - newLightness * newSaturation;
    const p = 2 * newLightness - q;
    const hue2rgb = (t: number): number =>
    {
        let value = t;
        if (value < 0) value += 1;
        if (value > 1) value -= 1;
        if (value < 1 / 6) return p + (q - p) * 6 * value;
        if (value < 1 / 2) return q;
        if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;

        return p;
    };

    color.r = hue2rgb(newHue + 1 / 3);
    color.g = hue2rgb(newHue);
    color.b = hue2rgb(newHue - 1 / 3);
}

/** 组件的宽松视图：示例只为几个字段取值/赋值，不必引入精确类型 */
type LooseComponent = { __type__?: string } & Record<string, unknown>;

/**
 * three.js `mesh.clone()` 的等价：深拷贝 Object3D 树，但**几何与骨骼数据复用**、
 * **材质独立**——各动物要自己的色相偏移，three 也是 `mesh.material = mesh.material.clone()`。
 */
function cloneMorph(source: Object3D): Object3D
{
    const clone = { ...source } as unknown as Record<string, unknown>;

    if (source.children)
    {
        clone.children = source.children.map(cloneMorph);
    }

    if (source.components)
    {
        clone.components = (source.components as unknown as LooseComponent[]).map((component) =>
        {
            const copy: LooseComponent = { ...component };
            const uniforms = copy.uniforms as Record<string, unknown> | undefined;

            if (uniforms)
            {
                // 只深一层：`u_diffuse` 这类值是对象，浅拷贝会让 9 只动物共享同一个扩散色
                const next: Record<string, unknown> = {};
                for (const key of Object.keys(uniforms))
                {
                    const value = uniforms[key];
                    next[key] = value !== null && typeof value === 'object' ? { ...(value as object) } : value;
                }
                copy.uniforms = next;
            }

            return copy;
        });
    }

    return clone as unknown as Object3D;
}

/** 一只动物（three 的 `morphs` 数组元素） */
interface Morph
{
    readonly mesh: Object3D;
    readonly animation: Animation;
    readonly speed: number;
}

const morphs: Morph[] = [];
/** 所有动物的公共父节点（three 直接 add 到 scene，这里挂同一个容器便于组织） */
const animalRoot: Object3D = { __type__: 'Object3D', name: 'morphs', children: [] };

/**
 * three.js 的 `addMorph`。
 *
 * `setDuration(duration)` / `startAt(-duration * random())` 的等价：
 * - 本仓 `Animation` 的 `time`/`length` 都是**毫秒**，`update` 每帧加 `interval * playspeed`，
 *   所以「用 duration 秒播完整段」就是 `playspeed = clip.length / (duration * 1000)`；
 * - `startAt` 是相位偏移，直接给 `time` 一个负初值（`updateAni` 对负数取模是安全的）。
 *
 * 渲染组件换成 `MorphMeshRenderer`：几何带 `morphTargets` 时它会把 delta 落成 storage buffer、
 * 把 `morphWeights` 写进 uniform，并把顶点着色器换成 morph 变体。
 * 动画由 `Scene.update` 自动驱动（`Animation` 在内置类型层次表里），示例不必手动调 update。
 */
function addMorph(source: Object3D, clip: AnimationClipData, speed: number, duration: number, x: number, y: number, z: number, fudgeColor = false): void
{
    const mesh = cloneMorph(source);
    const components = (mesh.components ?? null) as unknown as LooseComponent[] | null;

    // 渲染组件换成 MorphMeshRenderer（其余的组件保持原样）
    if (components)
    {
        for (const component of components)
        {
            if (component.__type__ === 'MeshRenderer') component.__type__ = 'MorphMeshRenderer';
        }
    }

    if (fudgeColor)
    {
        // three.js: mesh.material.color.offsetHSL( 0, random() * 0.5 - 0.25, random() * 0.5 - 0.25 )
        const offsetS = random() * 0.5 - 0.25;
        const offsetL = random() * 0.5 - 0.25;

        for (const component of components ?? [])
        {
            const uniforms = component.uniforms as Record<string, unknown> | undefined;
            const diffuse = uniforms?.u_diffuse as { r: number; g: number; b: number } | undefined;

            if (diffuse) offsetHSL(diffuse, 0, offsetS, offsetL);
        }
    }

    // three.js: mesh.castShadow = true; mesh.receiveShadow = true
    for (const component of components ?? [])
    {
        if ('castShadows' in component) component.castShadows = true;
        if ('receiveShadows' in component) component.receiveShadows = true;
    }

    const animation: Animation = {
        __type__: 'Animation',
        animation: clip,
        time: -duration * 1000 * random(),
        isplaying: true,
        playspeed: clip.length / (duration * 1000),
    };

    reactive(mesh).components = [...(mesh.components ?? []), animation];
    reactive(mesh).position = { x, y, z };
    reactive(mesh).rotation = { x: 0, y: Math.PI / 2, z: 0 };

    morphs.push({ mesh, animation, speed });
    reactive(animalRoot).children = [...(animalRoot.children ?? []), mesh];
}

// three.js: gltfloader.load( 'models/gltf/Horse.glb', ... ) 等四段
const horse = await loadGLFFromUrl('/Horse.glb');
const flamingo = await loadGLFFromUrl('/Flamingo.glb');
const stork = await loadGLFFromUrl('/Stork.glb');
const parrot = await loadGLFFromUrl('/Parrot.glb');

// three.js: const mesh = gltf.scene.children[ 0 ]; const clip = gltf.animations[ 0 ];
const horseMesh = horse.root.children![0];
const flamingoMesh = flamingo.root.children![0];
const storkMesh = stork.root.children![0];
const parrotMesh = parrot.root.children![0];

// three.js 的 6 只马（z = ±300 / ±450 / ±600）
for (const z of [300, 450, 600, -300, -450, -600])
{
    addMorph(horseMesh, horse.animationClips[0], 550, 1, 100 - random() * 1000, FLOOR, z, true);
}
addMorph(flamingoMesh, flamingo.animationClips[0], 500, 1, 500 - random() * 500, FLOOR + 350, 40);
addMorph(storkMesh, stork.animationClips[0], 350, 1, 500 - random() * 500, FLOOR + 350, 340);
addMorph(parrotMesh, parrot.animationClips[0], 450, 0.5, 500 - random() * 500, FLOOR + 300, 700);

// ---- 阶段 D：THREE.JS 立体字（three.js 的 TEXT 段）----
//
// three 的写法是 `new FontLoader().load('fonts/helvetiker_bold.typeface.json', font => …)`，
// 再用 `new TextGeometry('THREE.JS', { size: 200, depth: 50, curveSegments: 12, bevelThickness: 2,
// bevelSize: 5, bevelEnabled: true })`。
//
// 本仓自带 `Font`（@feng3d/math 的 shape/core/Font.ts，`generateShapes` 与 three 同构）与
// `ExtrudeGeometry`（@feng3d/addons）——所以文字几何不需要新写：
//
// bevel 倒角已在本仓的 `ExtrudeGeometry` 里实现（`bevelThickness`/`bevelSize`/`bevelSegments`），
// 参数与原示例逐项一致。注意 `bevelSegments` 沿用 three 的默认值 3——分层的 `t` 最大只到
// `(segments-1)/segments`，所以实际外扩量略小于 `bevelSize`（three 同样如此）。
const fontJson = await (await fetch('/helvetiker_bold.typeface.json')).json();
const textFont = new Font(fontJson);
const textShapes = textFont.generateShapes('THREE.JS', 200);

/** three.js: textMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000, specular: 0xffffff }) */
const textMaterial: StandardMaterial = {
    __type__: 'StandardMaterial',
    // 与地面材质同一口径：three 在线性空间算光照、输出时再编码回 sRGB。
    // 早先这里漏了这一项（地面有、文字没有），于是文字比 three 暗得多——
    // 影子与暗红的字挤在同一亮度区间，看起来就像「没有阴影」。
    linearLighting: true,
    uniforms: {
        u_diffuse: { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 },
        // MeshPhongMaterial 的 specular 0xffffff → 本仓的高光色 + 适度光泽
        u_specular: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        u_glossiness: 32,
        //
        // three 的 `scene.fog` 是**场景级**的，作用于所有材质；本仓的雾是逐材质 uniform，
        // 每个材质要自己带上——早先只有地面材质设了，**文字与动物材质的雾全丢了**。
        //
        // 实测证据：three 的红色文字像素里 **96.5% 的 G > 30**（中位数 47），
        // 那是雾色 `0x59472b`（G = 71）按约 0.42 的因子混进来的（文字距相机约 1900，
        // 落在 Fog(1000, 3000) 内）；而本仓文字 G 的中位数是 **0**——完全没有雾。
        u_fogMode: FogMode.LINEAR,
        u_fogColor: srgbColor4(FOG_COLOR),
        u_fogMinDistance: 1000,
        u_fogMaxDistance: FAR,
    },
};

/** three.js: mesh.position.y = FLOOR + 67；x 在拿到包围盒后再居中 */
const textObject: Object3D = {
    __type__: 'Object3D',
    name: 'THREE.JS',
    position: { x: 0, y: FLOOR + 67, z: 0 },
    components: [{
        __type__: 'MeshRenderer',
        geometry: {
            __type__: 'ExtrudeGeometry',
            shapes: textShapes,
            depth: 50,
            curveSegments: 12,
            // three.js: bevelThickness: 2, bevelSize: 5, bevelEnabled: true（bevelSegments 默认 3）
            bevelEnabled: true,
            bevelThickness: 2,
            bevelSize: 5,
        },
        material: textMaterial,
        castShadows: true,
        receiveShadows: true,
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
            // three.js: AmbientLight(0xffffff)——**同样要补 1/π**，理由见下。
            //
            // three 的漫反射是 `irradiance * BRDF_Lambert(albedo)`，而 `BRDF_Lambert = albedo / π`——
            // 那个 1/π 是对**整个入射辐照度**（环境 + 方向光之和）生效的，不是只作用于方向光。
            // 本仓的漫反射没有这个 1/π，所以要让两边等价，**必须让辐照度整体除以 π**：
            // 环境项与方向项都要除。
            //
            // 手算校验（地面法线朝上、光 (0,1500,1000) → dotNL = 0.832）：
            //   three: irradiance = 1.0 + 3.0*0.832 = 3.496，反射 = albedo * 3.496/π
            //          albedo(0xffdd99 线性化) = (1.0, 0.715, 0.318) → (1.113, 0.796, 0.354)
            //          编码回 sRGB ≈ (255, 231, 160)  ← 与 three 实测的地面 (255, 228, 158) 吻合
            //   本仓两项都除 π: irradiance = 0.318 + 0.955*0.832 = 1.113 → 同样的 (1.113, 0.796, 0.354)
            //
            // 反例（曾经改错过的版本）：只给方向光除 π、环境项留 1.0 → 辐照度 = 1.795，
            // 地面算出 (1.795, 1.283, 0.571)，编码后 G 直接饱和 —— 实测地面中位色 (255,255,255)、
            // 98.9% 的像素过曝（three 是 (255,228,158)、33%），这就是「地面偏亮」的真正原因。
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
            // 阶段 C 的 9 只动物（three.js 里直接 add 到 scene）
            animalRoot,
            // 阶段 D 的 THREE.JS 立体字
            textObject,
        ],
    },
};

const viewLogic = logic(view);

// three.js: textGeo.computeBoundingBox(); centerOffset = -0.5 * (max.x - min.x); mesh.position.x = centerOffset
{
    const textGeometry = (textObject.components![0] as unknown as { geometry: unknown }).geometry;
    const bounds = (logic(textGeometry as never) as unknown as { bounding: { min: { x: number }; max: { x: number } } }).bounding;
    const centerOffset = -0.5 * (bounds.max.x - bounds.min.x);

    reactive(textObject).position = { x: centerOffset, y: FLOOR + 67, z: 0 };
}

// three.js 的 light.target 默认在原点：让方向光的本地 -Z 指向原点
logic(lightObject).lookAt({ x: 0, y: 0, z: 0 });
// three.js 的 OrbitControls 初始朝向：`controls.target.set( 0, - 75, 25 ); controls.update();`
//
// ⚠️ **不是原点**。这一点是逐像素对齐的关键：
//   相机 (700, 50, 1900) 看向 (0, -75, 25) ⇒ dir = (-700, -125, -1875)、|dir| = 2005.3
//   ⇒ 俯角 = asin(125 / 2005.3) = **3.5738°**；
//   而看向原点只有 asin(50 / 2025.5) = 1.414°。两者差 2.16°，`fov=23°`、视口 600px 下约合 45px 的垂直偏移。
//
// 实测对照（用 page.route 在 three 页面上捕获相机实例读出的地面真值）：
//   three 的 camera.forward = (-0.349074, -0.062335, -0.93502)、pitch = -3.5738°
//   而看向原点应为 (-0.3456, -0.0247, -0.9381)、pitch = -1.414°
logic(firstPersonControls).lookAt({ x: 0, y: -75, z: 25 });

// three.js: 每帧 lightShadowMapViewer.render(renderer) 把当前阴影图与尺寸送进 shader
ticker.onframe(() =>
{
    updateHudLayout();
    const lightLogic = logic(lightComponent);
    const size = lightLogic.shadowMapSize;

    // u_invert: 1 —— three 的 ShadowMapViewer 输出的是 1 - depth（黑=无遮挡）
    reactive(hudMaterial).uniforms = { u_texSize: { x: size.x, y: size.y }, u_invert: 1 };
    reactive(hudMaterial).s_texture = lightLogic.shadowDepthTexture;
});

// three.js: window.addEventListener('keydown', onKeyDown) 里 case 84 /*t*/ 切换 showHUD
window.addEventListener('keydown', (event) =>
{
    if (event.code === 'KeyT')
    {
        reactive(hudPlane).activeSelf = !logic(hudPlane).activeSelf;
    }
});

// three.js 的 animate：`mixer.update( delta )` 与 morphs 的位移/循环。
//
// `Animation` 由 `Scene.update` 自动驱动（它在内置类型层次表里、会被按 'Behaviour' 收集到），
// 所以这里只做原示例的位移与循环。
ticker.onframe((interval) =>
{
    const delta = interval / 1000;   // three 的 clock.getDelta() 是秒

    for (const morph of morphs)
    {
        // three.js: mesh.position.x += mesh.speed * delta;
        //           if ( position.x > 2000 ) position.x = - 1000 - random() * 500;
        const position = logic(morph.mesh).position;
        const x = position.x + morph.speed * delta;

        reactive(morph.mesh).position = {
            x: x > 2000 ? -1000 - random() * 500 : x,
            y: position.y,
            z: position.z,
        };
    }
});

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
