import { WebGPU } from '@feng3d/webgpu';
import { Vector3 } from '@feng3d/math';
import { CustomGeometry, Geometry, logic, Object3D, reactive, Scene, StandardMaterial, View, Wireframe } from 'feng3d';
// IcosahedronGeometry 在 @feng3d/addons（移植自 three.js）。Icosa 接口本身只是类型，
// 但其文件末尾的 registerLogic 副作用必须执行：logic({__type__:'IcosahedronGeometry'}) 才能找到工厂。
// 直接 import '@feng3d/addons' 触发聚合入口的全部 registerLogic（含 Polyhedron/Icosa/Octa/...）
import '@feng3d/addons';
import type { IcosahedronGeometry } from '@feng3d/addons';

/**
 * 移植自 three.js examples/webgl_geometry_colors.html。
 *
 * 3 个 IcosahedronGeometry(radius=200, detail=1) 横向排列，每个 mesh 叠加一个 wireframe 子 mesh，
 * 顶点色按 Y 坐标 HSL 着色：
 * - 左：色相 HSL((y/r+1)/2, 1, 0.5)（彩虹色）
 * - 中：饱和度 HSL(0, (y/r+1)/2, 0.5)（红→白）
 * - 右：橙色 RGB(1, 0.8-(y/r+1)/2, 0)
 *
 * 相机 PerspectiveCamera(20, aspect, 1, 10000) position.z=1800，鼠标移动 → 相机缓动跟随。
 * DirectionalLight(0xffffff, 3) 在 +Z 方向。
 *
 * feng3d 适配：
 * - IcosahedronGeometry 在 @feng3d/addons（addons 中的 a_color 是 computed 全 1，无法外部改色），
 *   所以用 Icosa 仅生成 positions/indices/normals，再克隆到 CustomGeometry 注入按 Y 计算的颜色。
 * - MeshPhongMaterial{vertexColors:true, shininess:0} → StandardMaterial（feng3d 顶点色默认开启，
 *   无需开关；specular 黑 + glossiness 0 等价 shininess=0）
 * - MeshBasicMaterial{wireframe:true} → Wireframe 组件（feng3d 用独立组件实现线框，无需双材质）
 * - shadowMesh（CanvasTexture 径向渐变）暂不移植（feng3d 无 CanvasTexture 等价物，省略后核心
 *   顶点色效果不受影响）
 * - setAnimationLoop → requestAnimationFrame（与 ThreejsCubeTest 等其他移植示例一致）
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

let scene: Scene;

// ---- Icosa 几何体（仅用作基底数据源，不直接渲染） ----
const RADIUS = 200;
// 用 reactive 包装使 logic 求值（computed 在第一次访问 positions 时计算）
const ico1 = logic({ __type__: 'IcosahedronGeometry', radius: RADIUS, detail: 1 } as IcosahedronGeometry);
const ico2 = logic({ __type__: 'IcosahedronGeometry', radius: RADIUS, detail: 1 } as IcosahedronGeometry);
const ico3 = logic({ __type__: 'IcosahedronGeometry', radius: RADIUS, detail: 1 } as IcosahedronGeometry);

// ---- HSL → RGB（对应 three.js Color.setHSL） ----
function hslToRgb(h: number, s: number, l: number): [number, number, number]
{
    if (s === 0) return [l, l, l];
    const hue2rgb = (p: number, q: number, t: number): number =>
    {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;

        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

/**
 * 把 Icosa 基底数据 + 自定义着色规则合成 CustomGeometry（含 positions/normals/indices/colors）。
 *
 * @param ico 基底 Icosa logic（提供 positions/indices/normals）
 * @param colorFn 顶点颜色映射（y, radius）→ [r, g, b]
 */
function makeColoredGeometry(
    ico: ReturnType<typeof logic>,
    colorFn: (y: number, radius: number) => [number, number, number],
): CustomGeometry
{
    const positions = ico.positions as number[];
    const normals = ico.normals as number[];
    const indices = ico.indices as number[];

    // 按 Y 坐标计算颜色（顶点数 = positions.length / 3）
    const vCount = positions.length / 3;
    const colors: number[] = [];
    // uv：每顶点一个 (0,0) 占位（StandardMaterial vertex shader 声明 @location(3) uv，必须提供）
    // buildVertices 会跳过 data 长度为 0 的 attribute，所以这里要给非空 uv。
    const uvs: number[] = [];
    for (let i = 0; i < vCount; i++)
    {
        const y = positions[i * 3 + 1];
        const [r, g, b] = colorFn(y, RADIUS);
        // feng3d a_color 是 vec4（含 alpha），原示例没传 alpha → 用 1
        colors.push(r, g, b, 1);
        uvs.push(0, 0);
    }

    // CustomGeometry 通过 logic 写入 attributes（响应式追踪）
    const geo: CustomGeometry = { __type__: 'CustomGeometry' };
    const geoLogic = logic(geo);
    geoLogic.positions = positions;
    geoLogic.normals = normals;
    geoLogic.colors = colors;
    geoLogic.uvs = uvs;
    // CustomGeometry.indices 是 getter/setter，直接赋值
    (geoLogic as unknown as { indices: number[] }).indices = indices;

    return geo;
}

// 3 个几何体：左/中/右，对应 three.js 三段 setHSL/setRGB 算法
const geometry1 = makeColoredGeometry(ico1, (y, r) => hslToRgb((y / r + 1) / 2, 1.0, 0.5));
const geometry2 = makeColoredGeometry(ico2, (y, r) => hslToRgb(0, (y / r + 1) / 2, 0.5));
const geometry3 = makeColoredGeometry(ico3, (y, _r) => [1, 0.8 - (y / RADIUS + 1) / 2, 0]);

// ---- 共享材质 ----
// MeshPhongMaterial{color:0xffffff, vertexColors:true, shininess:0} → StandardMaterial
// （顶点色默认开启；specular 黑色 + glossiness 0 等价无高光）
const material: StandardMaterial = {
    __type__: 'StandardMaterial',
    uniforms: {
        u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
        u_glossiness: 0,
        // u_reflectivity 默认 1 会触发 envmap 采样：本场景无环境贴图，采样返回 0 会让
        // finalColor *= 0 → 整体变黑。显式置 0 关闭环境反射（与 three.js MeshPhong 一致）。
        u_reflectivity: 0,
    },
};

/** 创建一个 mesh + 内嵌 wireframe 子 mesh */
function makeMesh(geometry: Geometry, x: number, rotX = 0): Object3D
{
    return {
        __type__: 'Object3D',
        position: { x, y: 0, z: 0 },
        rotation: { x: rotX, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry,
            material,
        }, {
            // Wireframe 组件：feng3d 用独立组件渲染线框（对应 three.js MeshBasicMaterial{wireframe:true}）
            __type__: 'Wireframe',
            color: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
        } as unknown as Wireframe],
    };
}

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [scene = {
            __type__: 'Scene',
            // Scene.background = 0xffffff（白）
            background: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
            // 加白色 ambientColor：feng3d StandardMaterial 是 PBR 光照模型，背光面会被方向光
            // 算成全黑（顶点色 × 0 = 0），加上 ambient 后背光面也能保留顶点色，效果对齐
            // three.js MeshPhongMaterial 在弱光下的视觉表现。
            ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        }],
        children: [
            // 相机：PerspectiveCamera(20, aspect, 1, 10000)，position.z=1800
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 0, z: 1800 },
                components: [{
                    __type__: 'PerspectiveCamera',
                    fov: 20,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 1,
                    far: 10000,
                }],
            },
            // DirectionalLight(0xffffff, 3)，position (0,0,1)
            {
                __type__: 'Object3D',
                name: 'DirectionalLight',
                position: { x: 0, y: 0, z: 1 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 3,
                }],
            },
            // 3 个 Icosa mesh：左（rotation.x=-1.87）、中、右
            makeMesh(geometry1, -400, -1.87),
            makeMesh(geometry2, 400, 0),
            makeMesh(geometry3, 0, 0),
        ],
    },
};

const viewLogic = logic(view);

// ---- 鼠标跟随相机（对应 three.js onDocumentMouseMove + render 缓动） ----
const cameraObj = view.root!.children![0];
const origin = new Vector3(0, 0, 0);
let targetX = 0; let targetY = 0;

window.addEventListener('mousemove', (event) =>
{
    // three.js: mouseX = clientX - innerWidth/2；mouseY = clientY - innerHeight/2
    targetX = event.clientX - window.innerWidth / 2;
    targetY = event.clientY - window.innerHeight / 2;
});

function render(): void
{
    // 缓动 lerp 0.05（与 three.js 一致：camera.position.x += (mouseX - camera.position.x) * 0.05）
    const curPos = logic(cameraObj).position;
    const newX = curPos.x + (targetX - curPos.x) * 0.05;
    const newY = curPos.y + (-targetY - curPos.y) * 0.05;
    reactive(cameraObj).position = { x: newX, y: newY, z: 1800 };
    logic(cameraObj).lookAt(origin);

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(render);
}
requestAnimationFrame(render);
