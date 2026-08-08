import { WebGPU } from '@feng3d/webgpu';
import { Vector3 } from '@feng3d/math';
import { VertexDataGeometry, geometryUtils, Geometrys, logic, Object3D, reactive, Scene, SegmentGeometry, SegmentMaterial, StandardMaterial, View } from 'feng3d';
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
 *   所以用 Icosa 仅生成 positions/indices，再克隆到 VertexDataGeometry 注入按 Y 计算的颜色 + 重新算法线。
 * - MeshPhongMaterial{vertexColors:true, flatShading:true, shininess:0} → StandardMaterial：
 *   feng3d 顶点色默认开启；glossiness 0 等价 shininess=0（库已修：glossiness<=0 时高光返回 0，
 *   避免 WGSL pow(0,0)=NaN 致渲染全黑）；flatShading 通过 createVertexNormals 在非索引 Icosa 上
 *   重算每面法线实现（同面三顶点法线相同 → 硬边切面）。
 * - 光照对齐：three.js MeshPhong 漫反射含 1/π 衰减且无 AmbientLight（背光面纯黑），feng3d
 *   StandardMaterial 无 1/π、默认白色 ambient 会过曝。故 ambient 置 0、intensity 设 3/π，
 *   使正光面最大亮度（vertexColor × 0.955）与 three.js 一致。
 * - u_reflectivity 置 0：默认 1 会采样空环境贴图致全黑。
 * - MeshBasicMaterial{wireframe:true, color:0x000000}：feng3d Wireframe 组件是空壳未实现，
 *   改用子 Object3D + SegmentGeometry（buildWireframeSegments 从三角面边提取并去重）+ 黑色
 *   SegmentMaterial（line-list 拓扑）实现，子节点 scale 1.002 避免与填充面 z-fighting。
 * - shadowMesh（CanvasTexture 径向渐变阴影）：暂不移植。
 * - 残留差异：feng3d 渲染管线无 sRGB 色彩管理（顶点色当线性值、输出不编码），中间色调比
 *   three.js（sRGB→linear→光照→sRGB）略暗，需库层面支持才能完全对齐。
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
 * 把 Icosa 基底数据 + 自定义着色规则合成 VertexDataGeometry（含 positions/normals/indices/colors）。
 *
 * @param ico 基底 Icosa logic（提供 positions/indices/normals）
 * @param colorFn 顶点颜色映射（y, radius）→ [r, g, b]
 */
function makeColoredGeometry(
    ico: ReturnType<typeof logic>,
    colorFn: (y: number, radius: number) => [number, number, number],
): VertexDataGeometry
{
    const positions = ico.positions as number[];
    const indices = ico.indices as number[];
    // three.js 原示例用 flatShading:true，每面取恒定法线 → 硬边切面感。
    // Icosa(detail=1) 是非索引几何（240 顶点 = 80 面 × 3 顶点/面，每顶点唯一），
    // createVertexNormals 按 indices 为每顶点累加所属面法线再归一化；非索引时每顶点
    // 只归属一个面，结果即该面法线（同面三顶点法线相同），等价 flatShading。
    // （ico.normals 是平滑球面法线 normalize(position)，不用。）
    const normals = geometryUtils.createVertexNormals(indices, positions);

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

    // VertexDataGeometry 通过响应式数据接口写入顶点数据
    const geo: VertexDataGeometry = { __type__: 'VertexDataGeometry' };
    const r = reactive(geo);
    r.positions = positions;
    r.normals = normals;
    r.colors = colors;
    r.uvs = uvs;
    r.indices = indices;

    return geo;
}

/**
 * 从三角面几何体提取唯一边，构建 SegmentGeometry 的 segments 数据（全黑）。
 *
 * 对应 three.js `MeshBasicMaterial{ wireframe: true }`：把每个三角面的 3 条边作为线段，
 * 共享边去重后用黑色 line-list 绘制。返回的 segments 直接喂给 `{ __type__: 'SegmentGeometry', segments }`。
 *
 * @param positions 顶点位置（展平的 [x,y,z, ...]）
 * @param indices   三角面索引（每 3 个一组）
 */
function buildWireframeSegments(
    positions: number[],
    indices: number[],
): { start: { x: number; y: number; z: number }; end: { x: number; y: number; z: number }; startColor: { __type__: 'Color4'; r: number; g: number; b: number; a: number }; endColor: { __type__: 'Color4'; r: number; g: number; b: number; a: number } }[]
{
    const BLACK = { __type__: 'Color4' as const, r: 0, g: 0, b: 0, a: 1 };
    const seen = new Set<number>();
    const segments: { start: { x: number; y: number; z: number }; end: { x: number; y: number; z: number }; startColor: typeof BLACK; endColor: typeof BLACK }[] = [];
    // 边去重键：小索引在前，用 (a*顶点数+b) 编码（顶点数 < 2^21 时唯一）
    const vCount = positions.length / 3;
    const edgeKey = (a: number, b: number) => (a < b ? a * vCount + b : b * vCount + a);

    for (let i = 0; i < indices.length; i += 3)
    {
        const a = indices[i], b = indices[i + 1], c = indices[i + 2];
        for (const [u, v] of [[a, b], [b, c], [c, a]] as const)
        {
            const key = edgeKey(u, v);
            if (seen.has(key)) continue;
            seen.add(key);
            segments.push({
                start: { x: positions[u * 3], y: positions[u * 3 + 1], z: positions[u * 3 + 2] },
                end: { x: positions[v * 3], y: positions[v * 3 + 1], z: positions[v * 3 + 2] },
                startColor: BLACK,
                endColor: BLACK,
            });
        }
    }

    return segments;
}

// 3 个几何体：左/中/右，对应 three.js 三段 setHSL/setRGB 算法
const geometry1 = makeColoredGeometry(ico1, (y, r) => hslToRgb((y / r + 1) / 2, 1.0, 0.5));
const geometry2 = makeColoredGeometry(ico2, (y, r) => hslToRgb(0, (y / r + 1) / 2, 0.5));
const geometry3 = makeColoredGeometry(ico3, (y, _r) => [1, 0.8 - (y / RADIUS + 1) / 2, 0]);

// 3 份对应的线框 segment 数据（从各自几何体的三角面边提取）
const wireframe1: SegmentGeometry = { __type__: 'SegmentGeometry', segments: buildWireframeSegments(ico1.positions as number[], ico1.indices as number[]) };
const wireframe2: SegmentGeometry = { __type__: 'SegmentGeometry', segments: buildWireframeSegments(ico2.positions as number[], ico2.indices as number[]) };
const wireframe3: SegmentGeometry = { __type__: 'SegmentGeometry', segments: buildWireframeSegments(ico3.positions as number[], ico3.indices as number[]) };

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

/** 共享线框材质：黑色 SegmentMaterial（对应 three.js MeshBasicMaterial{wireframe:true, color:0x000000}） */
const wireframeMaterial: SegmentMaterial = {
    __type__: 'SegmentMaterial',
    uniforms: { u_segmentColor: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 } },
};

/**
 * 创建一个 mesh + 内嵌线框子 mesh。
 *
 * three.js 原示例用 `mesh.add(wireframe)` 把同几何体的线框作为子节点叠加；feng3d 的 Wireframe
 * 组件是空壳未实现，这里改为子 Object3D + SegmentGeometry(已从三角面边提取) + SegmentMaterial。
 * 子节点 scale 略大于 1，让线框浮在填充面外侧避免 z-fighting（与 three.js 子 mesh 共享几何体
 * 同样存在的深度竞争问题处理一致）。
 */
function makeMesh(geometry: Geometrys, wireframe: SegmentGeometry, x: number, rotX = 0): Object3D
{
    return {
        __type__: 'Object3D',
        position: { x, y: 0, z: 0 },
        rotation: { x: rotX, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry,
            material,
        }],
        children: [{
            __type__: 'Object3D',
            // 略微放大避免与父 mesh 表面 z-fighting
            scale: { x: 1.002, y: 1.002, z: 1.002 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: wireframe,
                material: wireframeMaterial,
            }],
        }],
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
            // three.js 原示例只有一个 DirectionalLight，无 AmbientLight，背光面纯黑。
            // feng3d StandardMaterial 的 ambientColor 默认白色会让背光面保留顶点色，
            // 颜色过曝、丢失明暗渐变；这里把 ambient 降到 0 对齐 three.js。
            ambientColor: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 0 },
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
            // three.js MeshPhong 漫反射含 1/π 衰减（BRDF_Lambert），
            // 等效最大亮度 = color × intensity × (1/π) = 1 × 3 × 0.3183 ≈ 0.955。
            // feng3d StandardMaterial 无 1/π 衰减，把 intensity 设为 3/π ≈ 0.955 即可让
            // 正光面最大亮度（vertexColor × 0.955）与 three.js 一致。
            {
                __type__: 'Object3D',
                name: 'DirectionalLight',
                position: { x: 0, y: 0, z: 1 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 3 / Math.PI,
                }],
            },
            // 3 个 Icosa mesh：左（rotation.x=-1.87）、中、右
            makeMesh(geometry1, wireframe1, -400, -1.87),
            makeMesh(geometry2, wireframe2, 400, 0),
            makeMesh(geometry3, wireframe3, 0, 0),
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
