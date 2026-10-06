import { WebGPU } from '@feng3d/webgpu';
import {
    ColorMaterial,
    createTextureFromCanvas,
    logic,
    mat4FromQuaternion,
    mat4GetRotation,
    quatFromUnitVectors,
    reactive,
    SegmentGeometry,
    SegmentMaterial,
    StandardMaterial,
    ticker,
    View,
} from 'feng3d';
import type { CustomGeometry, Matrix4x4, Object3D, ProjectedShadowMaterial, Vector3Like } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_shadowmesh.html（逐行复刻）。
 *
 * ## 原示例在做什么
 *
 * 5 个几何体（红方块 / 蓝圆柱 / 品红圆环 / 白球 / 黄棱锥）各自带一个 ShadowMesh：
 * 把自身几何体的顶点沿光源方向投影到地面平面（y=0.01）上，画出一片半透明纯黑剪影
 * （MeshBasicMaterial：color 0x000000 / opacity 0.6 / transparent / depthWrite:false，
 * 并用 stencil 保证同一像素只混合一次）。方块 / 圆柱 / 圆环同时沿水平、垂直圆周运动，
 * 阴影每帧跟着重投影；光源可用按钮在「平行光（w=0.001）/ 点光（w=0.9）」间切换，
 * 点光下投影变成透视投影、阴影向外发散。
 *
 * ## 与 three.js 的逐项对应
 *
 * - PerspectiveCamera(55, aspect, 1, 3000) + position(0, 2.5, 10) → PerspectiveCamera fov 55 / near 1 / far 3000
 * - scene.background = 0x0096ff → Scene.background
 * - DirectionalLight('rgb(255,255,255)', 3) → DirectionalLight intensity = 3/π（feng3d 漫反射无 1/π 因子）
 * - MeshLambertMaterial / MeshPhongMaterial → StandardMaterial（u_diffuse / u_emissive / u_glossiness）
 * - new ShadowMesh(mesh) + update(groundPlane, lightPosition4D) → ProjectedShadowMaterial + 每帧同步变换的阴影网格
 * - groundPlane = Plane((0,1,0), 0.01) → planeNormal / planeConstant（见 computeShadowMatrix）
 * - ArrowHelper（黄，3 个）→ SegmentGeometry 线段 + CylinderGeometry 锥头
 * - lightSphere / lightHolder（初始 visible=false）→ activeSelf: false 的球 / 圆柱
 * - clock.getDelta() → Date.now() 差值（e2e 冻结脚本把 Date.now 虚拟化为每帧 1/60s）
 * - lightPosition4D.w：0.001 平行光 / 0.9 点光 → 同上（按钮切换，见 lightButtonHandler）
 *
 * 阴影矩阵在 CPU 侧只随光源切换变化（投射体的位置 / 朝向由引擎的 modelMatrix 承担），
 * 与 three.js 把 shadowMatrix * meshMatrix 写进 ShadowMesh.matrix 等价。
 */

/** 2π（three.js: TWO_PI） */
const TWO_PI = Math.PI * 2;

/** 地面平面法线（three.js: normalVector = new Vector3(0, 1, 0)） */
const planeNormal: Vector3Like = { x: 0, y: 1, z: 0 };

/** 平面常数（three.js: planeConstant = 0.01，必须略高于地面 y=0） */
const planeConstant = 0.01;

/** 场景原点（three.js: scene.position，用于 sunLight.lookAt） */
const scenePosition: Vector3Like = { x: 0, y: 0, z: 0 };

/**
 * 光源位置（4D）。w 是光线发散程度：0.001 约等于平行光、0.9 约等于点光。
 *
 * three.js: lightPosition4D（init 里从 sunLight.position 初始化，按钮切换时改写）。
 */
const lightPosition4D = { x: 5, y: 7, z: -1, w: 0.001 };

/**
 * 归一化三维向量（示例内私有，避免依赖具体的数学工具函数名）。
 *
 * @param v 任意向量
 * @returns 单位向量
 */
function normalize3(v: Vector3Like): Vector3Like
{
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);

    return { x: v.x / length, y: v.y / length, z: v.z / length };
}

/**
 * 计算地面投影矩阵（three.js ShadowMesh.update 的逐元素复刻，列主序）。
 *
 * 原式（https://www.opengl.org/archives/resources/features/StencilTalk/tsld021.htm）：
 *
 *     dot = n.x*L.x + n.y*L.y + n.z*L.z + (-c) * L.w
 *     row0 = [dot - L.x*n.x,      -L.x*n.y,         -L.x*n.z,      -L.x*-c]
 *     row1 = [     -L.y*n.x,  dot - L.y*n.y,        -L.y*n.z,      -L.y*-c]
 *     row2 = [     -L.z*n.x,      -L.z*n.y,     dot - L.z*n.z,     -L.z*-c]
 *     row3 = [     -L.w*n.x,      -L.w*n.y,         -L.w*n.z,  dot - L.w*-c]
 *
 * @returns 16 个列主序矩阵元素（与 Matrix4x4.elements、three Matrix4.elements 同序）
 */
function computeShadowMatrix(): number[]
{
    const n = planeNormal;
    const l = lightPosition4D;
    const c = planeConstant;
    const dot = n.x * l.x + n.y * l.y + n.z * l.z + (-c) * l.w;
    const elements: number[] = new Array(16);

    elements[0] = dot - l.x * n.x;
    elements[4] = -l.x * n.y;
    elements[8] = -l.x * n.z;
    elements[12] = -l.x * -c;
    elements[1] = -l.y * n.x;
    elements[5] = dot - l.y * n.y;
    elements[9] = -l.y * n.z;
    elements[13] = -l.y * -c;
    elements[2] = -l.z * n.x;
    elements[6] = -l.z * n.y;
    elements[10] = dot - l.z * n.z;
    elements[14] = -l.z * -c;
    elements[3] = -l.w * n.x;
    elements[7] = -l.w * n.y;
    elements[11] = -l.w * n.z;
    elements[15] = dot - l.w * -c;

    return elements;
}

/** 阴影投影矩阵（所有阴影材质共享；仅光源切换时替换 elements） */
const shadowMatrix: Matrix4x4 = { __type__: 'Matrix4x4', elements: computeShadowMatrix() };

/**
 * 1×1 纯色纹理（对应 three.js MeshPhongMaterial 默认 specular 0x111111）。
 *
 * 注意：StandardMaterial 的 u_specular 会被 s_specular 纹理覆盖（specularColor = 纹理 rgb），
 * 默认纹理是白色，因此这里显式提供深灰纹理，避免所有物体出现强高光。
 *
 * @returns 1×1 深灰纹理
 */
function createSpecularTexture(): ReturnType<typeof createTextureFromCanvas>
{
    const canvas = document.createElement('canvas');

    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d')!;

    // three.js MeshPhongMaterial 默认 specular 0x111111 → 线性 ≈ 0.0056（8 位纹理取 2/255 ≈ 0.0078）
    context.fillStyle = 'rgb(2, 2, 2)';
    context.fillRect(0, 0, 1, 1);

    return createTextureFromCanvas(canvas);
}

const specularTexture = createSpecularTexture();

// u_emissive 是**线性**色值（three.js Color 在 colorManagement 下的工作空间）：
// StandardMaterial 的着色器在 γ 空间做等效合成 out = (out_linear + emissive)^(1/2.2)，
// 暗面因此得到 (emissive)^(1/2.2) —— 即 three 的 emissive 的 sRGB 显示值。

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- 几何体（投射体与阴影共用同一份几何数据，对应 three.js ShadowMesh 复用 mesh.geometry）----
const groundGeometry = { __type__: 'CubeGeometry', width: 30, height: 0.01, depth: 40 } as const;
const cubeGeometry = { __type__: 'CubeGeometry', width: 1, height: 1, depth: 1 } as const;
// three.js: CylinderGeometry(0.3, 0.3, 2)（默认 radialSegments 32）
const cylinderGeometry = { __type__: 'CylinderGeometry', topRadius: 0.3, bottomRadius: 0.3, height: 2, segmentsW: 32, segmentsH: 1 } as const;
// three.js: TorusGeometry(1, 0.2, 10, 16, 2π) —— feng3d 的 segmentsR 对应 tubularSegments、segmentsT 对应 radialSegments；
// feng3d 默认 yUp: true（圆环水平放在 XZ 平面），three 默认在 XY 平面，故显式取 false 与 three 同向
const torusGeometry = { __type__: 'TorusGeometry', radius: 1, tubeRadius: 0.2, segmentsR: 16, segmentsT: 10, yUp: false } as const;
const sphereGeometry = { __type__: 'SphereGeometry', radius: 0.5, segmentsW: 20, segmentsH: 10 } as const;
/**
 * 四棱锥几何体（three.js CylinderGeometry(0, 0.5, 2, 4) + flatShading:true 的等价物）。
 *
 * three 的 flatShading 在片元着色器里用屏幕空间导数取面法线；这里改为**每面独立顶点 +
 * 面法线**，二者对三角形来说结果相同，且不需要改动引擎的 standard 着色器。
 *
 * @returns 自定义几何体数据（24 个非共享顶点：4 个侧面三角形 + 4 个底面三角形）
 */
function buildPyramidGeometry(): CustomGeometry
{
    const radialSegments = 4;
    const radiusBottom = 0.5;
    const halfHeight = 1;
    const apex: Vector3Like = { x: 0, y: halfHeight, z: 0 };
    const baseRing: Vector3Like[] = [];
    const positions: number[] = [];
    const normals: number[] = [];

    for (let i = 0; i < radialSegments; i++)
    {
        const theta = (i / radialSegments) * Math.PI * 2;

        baseRing.push({
            x: radiusBottom * Math.sin(theta),
            y: -halfHeight,
            z: radiusBottom * Math.cos(theta),
        });
    }

    /** 追加一个三角形（顶点顺序决定外法线方向），法线取面法线 */
    function pushTriangle(a: Vector3Like, b: Vector3Like, c: Vector3Like): void
    {
        const ux = b.x - a.x; const uy = b.y - a.y; const uz = b.z - a.z;
        const vx = c.x - a.x; const vy = c.y - a.y; const vz = c.z - a.z;
        const nx = uy * vz - uz * vy;
        const ny = uz * vx - ux * vz;
        const nz = ux * vy - uy * vx;
        const length = Math.sqrt(nx * nx + ny * ny + nz * nz);

        for (const point of [a, b, c])
        {
            positions.push(point.x, point.y, point.z);
            normals.push(nx / length, ny / length, nz / length);
        }
    }

    for (let i = 0; i < radialSegments; i++)
    {
        pushTriangle(apex, baseRing[i], baseRing[(i + 1) % radialSegments]);
    }
    const center: Vector3Like = { x: 0, y: -halfHeight, z: 0 };

    for (let i = 0; i < radialSegments; i++)
    {
        pushTriangle(center, baseRing[(i + 1) % radialSegments], baseRing[i]);
    }

    const vertexCount = positions.length / 3;

    return {
        __type__: 'CustomGeometry',
        positions,
        normals,
        uvs: new Array(vertexCount * 2).fill(0.5),
        colors: new Array(vertexCount * 4).fill(1),
        indices: Array.from({ length: vertexCount }, (_, index) => index),
    };
}

const pyramidGeometry = buildPyramidGeometry();

/**
 * 阴影材质工厂（每个阴影网格一个实例，共享同一个投影矩阵对象）。
 *
 * @returns 平面投影阴影材质数据
 */
function createShadowMaterial(): ProjectedShadowMaterial
{
    return {
        __type__: 'ProjectedShadowMaterial',
        uniforms: { u_shadowMatrix: shadowMatrix },
    };
}

/**
 * 把一个物体的世界变换同步给它的阴影网格。
 *
 * 对应 three.js 每帧 shadowMesh.update(...) 时把 shadowMatrix * meshMatrix 作为阴影网格的
 * 矩阵——这里改为让阴影网格与投射体保持同一变换，投影矩阵则由材质提供。
 *
 * @param target 阴影网格对象
 * @param position 投射体位置
 * @param rotation 投射体旋转
 */
function setTransform(target: Object3D, position: Vector3Like, rotation: Vector3Like): void
{
    const r_target = reactive(target);

    r_target.position = { x: position.x, y: position.y, z: position.z };
    r_target.rotation = { x: rotation.x, y: rotation.y, z: rotation.z };
}

// ---- 动画状态（raw，不参与响应式读取；three.js 里直接写在 Object3D 上）----
let lastTime = Date.now();
let horizontalAngle = 0;
let verticalAngle = 0;
let useDirectionalLight = true;

const cubePosition = { x: 0, y: 0.5, z: -1 };
const cylinderPosition = { x: 0, y: 1, z: -2.5 };
const torusPosition = { x: 0, y: 0.5, z: -6 };
const cubeRotation = { x: 0, y: 0, z: 0 };
const cylinderRotation = { x: 0, y: 0, z: 0 };
const torusRotation = { x: 0, y: 0, z: 0 };
const pyramidRotation = { x: 0, y: 0, z: 0 };
const pyramidPosition = { x: -4, y: 1, z: 2 };

// ---- 物体引用（供动画与光源切换写入）----
let sunLightObject: Object3D;
let groundMaterial: StandardMaterial;
let cubeObject: Object3D;
let cylinderObject: Object3D;
let torusObject: Object3D;
let cubeShadowObject: Object3D;
let cylinderShadowObject: Object3D;
let torusShadowObject: Object3D;
let pyramidObject: Object3D;
let pyramidShadowObject: Object3D;
let arrowLineObject: Object3D;
let arrowConeObjects: Object3D[] = [];
let lightSphereObject: Object3D;
let lightHolderObject: Object3D;

// ---- 光源辅助：3 个黄色箭头（ArrowHelper）----
// three.js: arrowDirection = normalize(scene.position - sunLight.position)
const arrowDirection = normalize3({
    x: scenePosition.x - lightPosition4D.x,
    y: scenePosition.y - lightPosition4D.y,
    z: scenePosition.z - lightPosition4D.z,
});
const arrowLength = 0.9;
const arrowHeadLength = 0.25;
const arrowHeadWidth = 0.08;
const arrowOrigins: Vector3Like[] = [
    { x: 5, y: 7, z: -1 },
    { x: 5, y: 7.2, z: -1 },
    { x: 5, y: 6.8, z: -1 },
];

/**
 * 箭头线段终点（three.js: line.scale.y = length - headLength）。
 *
 * @param origin 箭头起点
 * @returns 线段终点
 */
function arrowLineEnd(origin: Vector3Like): Vector3Like
{
    const lineLength = arrowLength - arrowHeadLength;

    return {
        x: origin.x + arrowDirection.x * lineLength,
        y: origin.y + arrowDirection.y * lineLength,
        z: origin.z + arrowDirection.z * lineLength,
    };
}

/**
 * 锥头中心（three.js: cone.position.y = length、scale = (headWidth, headLength, headWidth)）。
 *
 * @param origin 箭头起点
 * @returns 锥头中心位置
 */
function arrowConePosition(origin: Vector3Like): Vector3Like
{
    const center = arrowLength - arrowHeadLength / 2;

    return {
        x: origin.x + arrowDirection.x * center,
        y: origin.y + arrowDirection.y * center,
        z: origin.z + arrowDirection.z * center,
    };
}

/**
 * 锥头朝向：把 +Y 轴转到箭头方向（three.js ArrowHelper.setDirection 的等价实现——同一旋转轴）。
 *
 * @returns 欧拉角（弧度）
 */
function arrowConeRotation(): Vector3Like
{
    const quaternion = quatFromUnitVectors({ x: 0, y: 1, z: 0 }, arrowDirection);
    const rotation = { x: 0, y: 0, z: 0 };

    return mat4GetRotation(mat4FromQuaternion(quaternion), rotation);
}

const arrowConeRotationValue = arrowConeRotation();
const arrowSegments: SegmentGeometry['segments'] = arrowOrigins.map((origin) => ({
    start: origin,
    end: arrowLineEnd(origin),
    startColor: { __type__: 'Color4', r: 1, g: 1, b: 0, a: 1 },
    endColor: { __type__: 'Color4', r: 1, g: 1, b: 0, a: 1 },
}));
const arrowConeGeometry = { __type__: 'CylinderGeometry', topRadius: 0, bottomRadius: 0.5, height: 1, segmentsW: 5, segmentsH: 1 } as const;
const arrowMaterial = {
    __type__: 'ColorMaterial',
    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 1, g: 1, b: 0, a: 1 } },
} as ColorMaterial;

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            // three.js: scene.background = 0x0096ff
            background: { __type__: 'Color4', r: 0, g: 0.588, b: 1, a: 1 },
            // three.js 本示例没有 AmbientLight：环境光置零，暗面亮度全部来自材质 emissive
            ambientColor: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 0 },
        }],
        children: [
            // 相机（three.js: PerspectiveCamera(55, aspect, 1, 3000)，position(0, 2.5, 10)）
            {
                __type__: 'Object3D', name: 'Main Camera',
                position: { x: 0, y: 2.5, z: 10 },
                components: [{
                    __type__: 'PerspectiveCamera', fov: 55,
                    aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 3000,
                }],
            },
            // 方向光（three.js: DirectionalLight('rgb(255,255,255)', 3)，position(5,7,-1) 且 lookAt 原点）
            sunLightObject = {
                __type__: 'Object3D', name: 'sunLight',
                position: { x: 5, y: 7, z: -1 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    // linearLighting 材质在线性空间光照：three.js 的漫反射带 1/π（BRDF_Lambert），
                    // fengd3 没有该因子，故 intensity = three 的 3 × 1/π
                    intensity: 3 / Math.PI,
                }],
            },
            // 地面（three.js: BoxGeometry(30, 0.01, 40) + MeshLambertMaterial('rgb(0,130,0)')）
            {
                __type__: 'Object3D', name: 'ground',
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: groundGeometry,
                    material: groundMaterial = {
                        __type__: 'StandardMaterial',
                        linearLighting: true,
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0, g: 130 / 255, b: 0, a: 1 },
                            // Lambert：无高光
                            u_glossiness: 0, u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                }],
            },
            // 红色方块及其阴影（three.js: color rgb(255,0,0)、emissive 0x200000）
            cubeObject = {
                __type__: 'Object3D', name: 'cube', position: { x: 0, y: 0.5, z: -1 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: cubeGeometry,
                    material: {
                        __type__: 'StandardMaterial',
                        linearLighting: true,
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 },
                            u_emissive: { __type__: 'Color4', r: 0.0105, g: 0, b: 0, a: 1 },
                            u_glossiness: 30, u_reflectivity: 0,
                        },
                        s_specular: specularTexture,
                    } as StandardMaterial,
                }],
            },
            cubeShadowObject = {
                __type__: 'Object3D', name: 'cubeShadow', position: { x: 0, y: 0.5, z: -1 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{ __type__: 'MeshRenderer', geometry: cubeGeometry, material: createShadowMaterial() }],
            },
            // 蓝色圆柱及其阴影（three.js: CylinderGeometry(0.3,0.3,2)、color rgb(0,0,255)、emissive 0x000020）
            cylinderObject = {
                __type__: 'Object3D', name: 'cylinder', position: { x: 0, y: 1, z: -2.5 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: cylinderGeometry,
                    material: {
                        __type__: 'StandardMaterial',
                        linearLighting: true,
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0, g: 0, b: 1, a: 1 },
                            u_emissive: { __type__: 'Color4', r: 0, g: 0, b: 0.0105, a: 1 },
                            u_glossiness: 30, u_reflectivity: 0,
                        },
                        s_specular: specularTexture,
                    } as StandardMaterial,
                }],
            },
            cylinderShadowObject = {
                __type__: 'Object3D', name: 'cylinderShadow', position: { x: 0, y: 1, z: -2.5 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{ __type__: 'MeshRenderer', geometry: cylinderGeometry, material: createShadowMaterial() }],
            },
            // 品红圆环及其阴影（three.js: TorusGeometry(1,0.2,10,16)、color rgb(255,0,255)、emissive 0x200020）
            torusObject = {
                __type__: 'Object3D', name: 'torus', position: { x: 0, y: 0.5, z: -6 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: torusGeometry,
                    material: {
                        __type__: 'StandardMaterial',
                        linearLighting: true,
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 1, g: 0, b: 1, a: 1 },
                            u_emissive: { __type__: 'Color4', r: 0.0105, g: 0, b: 0.0105, a: 1 },
                            u_glossiness: 30, u_reflectivity: 0,
                        },
                        s_specular: specularTexture,
                    } as StandardMaterial,
                }],
            },
            torusShadowObject = {
                __type__: 'Object3D', name: 'torusShadow', position: { x: 0, y: 0.5, z: -6 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{ __type__: 'MeshRenderer', geometry: torusGeometry, material: createShadowMaterial() }],
            },
            // 白色球及其阴影（three.js: SphereGeometry(0.5,20,10)、position(4,0.5,2)、emissive 0x222222）
            {
                __type__: 'Object3D', name: 'sphere', position: { x: 4, y: 0.5, z: 2 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: sphereGeometry,
                    material: {
                        __type__: 'StandardMaterial',
                        linearLighting: true,
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                            u_emissive: { __type__: 'Color4', r: 0.0121, g: 0.0121, b: 0.0121, a: 1 },
                            u_glossiness: 30, u_reflectivity: 0,
                        },
                        s_specular: specularTexture,
                    } as StandardMaterial,
                }],
            },
            {
                __type__: 'Object3D', name: 'sphereShadow', position: { x: 4, y: 0.5, z: 2 },
                components: [{ __type__: 'MeshRenderer', geometry: sphereGeometry, material: createShadowMaterial() }],
            },
            // 黄色棱锥及其阴影（three.js: CylinderGeometry(0,0.5,2,4)、position(-4,1,2)、emissive 0x440000、shininess 0）
            pyramidObject = {
                __type__: 'Object3D', name: 'pyramid', position: { x: -4, y: 1, z: 2 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: pyramidGeometry,
                    material: {
                        __type__: 'StandardMaterial',
                        linearLighting: true,
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 0, a: 1 },
                            u_emissive: { __type__: 'Color4', r: 0.0546, g: 0, b: 0, a: 1 },
                            u_glossiness: 0, u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                }],
            },
            pyramidShadowObject = {
                __type__: 'Object3D', name: 'pyramidShadow', position: { x: -4, y: 1, z: 2 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{ __type__: 'MeshRenderer', geometry: pyramidGeometry, material: createShadowMaterial() }],
            },
            // 黄色箭头（three.js: 3 个 ArrowHelper）——线用线段几何体、锥头用 CylinderGeometry(0,0.5,1,5)
            arrowLineObject = {
                __type__: 'Object3D', name: 'arrowLines',
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SegmentGeometry', segments: arrowSegments } as SegmentGeometry,
                    material: { __type__: 'SegmentMaterial' } as SegmentMaterial,
                }],
            },
            {
                __type__: 'Object3D', name: 'arrowCones',
                children: arrowConeObjects = arrowOrigins.map((origin, index) => ({
                    __type__: 'Object3D' as const, name: 'arrowCone' + index,
                    position: arrowConePosition(origin),
                    rotation: arrowConeRotationValue,
                    scale: { x: arrowHeadWidth, y: arrowHeadLength, z: arrowHeadWidth },
                    components: [{
                        __type__: 'MeshRenderer' as const,
                        geometry: arrowConeGeometry,
                        material: arrowMaterial,
                    }],
                })),
            },
            // 灯泡（three.js: lightSphere / lightHolder，初始 visible = false）
            lightSphereObject = {
                __type__: 'Object3D', name: 'lightSphere', activeSelf: false,
                position: { x: 0, y: 6, z: -2 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SphereGeometry', radius: 0.09, segmentsW: 32, segmentsH: 16 } as const,
                    material: {
                        __type__: 'ColorMaterial',
                        uniforms: { u_diffuseInput: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
                    } as ColorMaterial,
                }],
            },
            lightHolderObject = {
                __type__: 'Object3D', name: 'lightHolder', activeSelf: false,
                position: { x: 0, y: 6.12, z: -2 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CylinderGeometry', topRadius: 0.05, bottomRadius: 0.05, height: 0.13, segmentsW: 32, segmentsH: 1 } as const,
                    material: {
                        __type__: 'ColorMaterial',
                        uniforms: { u_diffuseInput: { __type__: 'Color4', r: 75 / 255, g: 75 / 255, b: 75 / 255, a: 1 } },
                    } as ColorMaterial,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);

// 方向光朝向原点（three.js: sunLight.lookAt(scene.position)）
logic(sunLightObject).lookAt(scenePosition);

const lightButton = document.getElementById('lightButton') as HTMLInputElement;

/**
 * 切换平行光 / 点光（three.js lightButtonHandler 的逐行复刻）。
 *
 * 平行光：天蓝背景 + 绿色地面 + 箭头可见 + w=0.001（近乎平行投影）
 * 点光：  黑色背景 + 灰色地面 + 灯泡可见 + w=0.9（透视投影，阴影向外发散）
 */
function lightButtonHandler(): void
{
    useDirectionalLight = !useDirectionalLight;

    if (useDirectionalLight)
    {
        reactive(view.root!.components![0]!).background = { __type__: 'Color4', r: 0, g: 0.588, b: 1, a: 1 };
        reactive(groundMaterial).uniforms = {
            u_diffuse: { __type__: 'Color4', r: 0, g: 130 / 255, b: 0, a: 1 },
            u_glossiness: 0, u_reflectivity: 0,
        };
        reactive(sunLightObject).position = { x: 5, y: 7, z: -1 };
        logic(sunLightObject).lookAt(scenePosition);
        lightPosition4D.x = 5; lightPosition4D.y = 7; lightPosition4D.z = -1; lightPosition4D.w = 0.001;
        reactive(arrowLineObject).activeSelf = true;
        for (const cone of arrowConeObjects) reactive(cone).activeSelf = true;
        reactive(lightSphereObject).activeSelf = false;
        reactive(lightHolderObject).activeSelf = false;
        lightButton.value = 'Switch to PointLight';
    }
    else
    {
        reactive(view.root!.components![0]!).background = { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 };
        reactive(groundMaterial).uniforms = {
            u_diffuse: { __type__: 'Color4', r: 150 / 255, g: 150 / 255, b: 150 / 255, a: 1 },
            u_glossiness: 0, u_reflectivity: 0,
        };
        reactive(sunLightObject).position = { x: 0, y: 6, z: -2 };
        logic(sunLightObject).lookAt(scenePosition);
        lightPosition4D.x = 0; lightPosition4D.y = 6; lightPosition4D.z = -2; lightPosition4D.w = 0.9;
        reactive(arrowLineObject).activeSelf = false;
        for (const cone of arrowConeObjects) reactive(cone).activeSelf = false;
        reactive(lightSphereObject).activeSelf = true;
        reactive(lightSphereObject).position = { x: 0, y: 6, z: -2 };
        reactive(lightHolderObject).activeSelf = true;
        reactive(lightHolderObject).position = { x: 0, y: 6.12, z: -2 };
        lightButton.value = 'Switch to THREE.DirectionalLight';
    }

    // 投影矩阵随光源位置与发散程度变化（w=0.001 平行投影；w=0.9 透视投影）
    reactive(shadowMatrix).elements = computeShadowMatrix();
}

lightButton.addEventListener('click', lightButtonHandler);

/** 阴影网格与对应投射体（每帧同步变换） */
const shadowSyncTargets: { shadow: Object3D; position: Vector3Like; rotation: Vector3Like }[] = [
    { shadow: cubeShadowObject, position: cubePosition, rotation: cubeRotation },
    { shadow: cylinderShadowObject, position: cylinderPosition, rotation: cylinderRotation },
    { shadow: torusShadowObject, position: torusPosition, rotation: torusRotation },
    { shadow: pyramidShadowObject, position: pyramidPosition, rotation: pyramidRotation },
];

// three.js animate()：frameTime = clock.getDelta()，各物体按它累加旋转与圆周角度
ticker.onframe(() =>
{
    const now = Date.now();
    const frameTime = (now - lastTime) / 1000;

    lastTime = now;

    // 旋转
    cubeRotation.x += 1.0 * frameTime; cubeRotation.y += 1.0 * frameTime;
    cylinderRotation.y += 1.0 * frameTime; cylinderRotation.z -= 1.0 * frameTime;
    torusRotation.x -= 1.0 * frameTime; torusRotation.y -= 1.0 * frameTime;
    pyramidRotation.y += 0.5 * frameTime;

    // 水平圆周（three.js: horizontalAngle += 0.5 * frameTime）
    horizontalAngle += 0.5 * frameTime;
    if (horizontalAngle > TWO_PI) horizontalAngle -= TWO_PI;
    cubePosition.x = Math.sin(horizontalAngle) * 4;
    cylinderPosition.x = Math.sin(horizontalAngle) * -4;
    torusPosition.x = Math.cos(horizontalAngle) * 4;

    // 垂直圆周（three.js: verticalAngle += 1.5 * frameTime）
    verticalAngle += 1.5 * frameTime;
    if (verticalAngle > TWO_PI) verticalAngle -= TWO_PI;
    cubePosition.y = Math.sin(verticalAngle) * 2 + 2.9;
    cylinderPosition.y = Math.sin(verticalAngle) * 2 + 3.1;
    torusPosition.y = Math.cos(verticalAngle) * 2 + 3.3;

    // 写回渲染数据
    setTransform(cubeObject, cubePosition, cubeRotation);
    setTransform(cylinderObject, cylinderPosition, cylinderRotation);
    setTransform(torusObject, torusPosition, torusRotation);
    setTransform(pyramidObject, pyramidPosition, pyramidRotation);

    // 阴影跟随投射体（three.js: cubeShadow.update(...) 等）
    for (const item of shadowSyncTargets) setTransform(item.shadow, item.position, item.rotation);

    webgpu.submit(viewLogic.submit);
});
