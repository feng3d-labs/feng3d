import { WebGPU } from '@feng3d/webgpu';
import { Vector3 } from '@feng3d/math';
import { logic, Object3D, reactive, Scene, SegmentGeometry, SegmentMaterial, View } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_lines_dashed.html。
 *
 * 原示例：3D 希尔伯特曲线（GeometryUtils.hilbert3D）经 CatmullRom 样条平滑采样后，
 * 用 LineDashedMaterial（dashSize/gapSize）画白色虚线；外加一个橙色立方体边框虚线（LineSegments）。
 * 每帧旋转（x=0.25*time, y=0.25*time）。PerspectiveCamera(60) position.z=150，Fog 线性雾。
 *
 * feng3d 适配：
 * - LineDashedMaterial（虚线）：feng3d 暂无虚线材质（SegmentMaterial 只支持实线 line-list），
 *   这里用 SegmentMaterial 画连续实线段替代，保留希尔伯特曲线 + 立方体边框的几何结构。
 *   （虚线需 shader 层按累计长度 step 计算 discard，待库实现。）
 * - THREE.Line（连续折线 line-strip）→ SegmentGeometry（line-list）：把 N 个采样点折线拆成
 *   N-1 个连续 segment（点 i → 点 i+1），相邻 segment 共享端点，视觉等价一条折线。
 * - THREE.LineSegments（独立线段集合）→ SegmentGeometry：立方体 12 条边直接作为独立 segment。
 * - hilbert3D / CatmullRomCurve3.getPoints：纯数学算法，内联实现（Catmull-Rom 均匀参数化）。
 * - Fog(0x111111, 150, 200)：SegmentMaterial 走独立 line shader 不支持雾，省略（背景同色已弱化远处）。
 * - 鼠标控制相机（替代原固定相机）：鼠标移动 → 相机环绕中心缓动。
 * - setAnimationLoop → requestAnimationFrame。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- 希尔伯特 3D 曲线（移植自 three.js GeometryUtils.hilbert3D） ----
// 生成递归三维希尔伯特曲线顶点序列，返回 [Vector3, ...]
function hilbert3D(center: Vector3, width: number, recursion: number,
    v0: number, v1: number, v2: number, v3: number, v4: number,
    v5: number, v6: number, v7: number): Vector3[]
{
    const half = width / 2;
    const vec_s = [
        new Vector3(center.x - half, center.y + half, center.z - half),
        new Vector3(center.x - half, center.y + half, center.z + half),
        new Vector3(center.x - half, center.y - half, center.z + half),
        new Vector3(center.x - half, center.y - half, center.z - half),
        new Vector3(center.x + half, center.y + half, center.z - half),
        new Vector3(center.x + half, center.y + half, center.z + half),
        new Vector3(center.x + half, center.y - half, center.z + half),
        new Vector3(center.x + half, center.y - half, center.z - half),
    ];

    const vec = [vec_s[v0], vec_s[v1], vec_s[v2], vec_s[v3], vec_s[v4], vec_s[v5], vec_s[v6], vec_s[v7]];

    // 递归：对每个子立方体再生成希尔伯特曲线
    if (--recursion >= 0)
    {
        const tmp: Vector3[] = [];
        const center0 = vec[0];
        const center1 = vec[3];
        const center2 = vec[4];
        const center3 = vec[7];

        tmp.push(...hilbert3D(center0, half, recursion, v0, v3, v4, v7, v6, v5, v2, v1));
        tmp.push(...hilbert3D(center1, half, recursion, v0, v7, v6, v1, v2, v5, v4, v3));
        tmp.push(...hilbert3D(center2, half, recursion, v0, v7, v6, v1, v2, v5, v4, v3));
        tmp.push(...hilbert3D(center3, half, recursion, v0, v3, v4, v7, v6, v5, v2, v1));

        return tmp;
    }

    return vec;
}

// ---- Catmull-Rom 样条均匀采样（移植自 three.js CatmullRomCurve3.getPoints） ----
// 对控制点做三次 Catmull-Rom 插值，每段细分为 divisions 段，返回平滑曲线采样点
function catmullRomGetPoints(points: Vector3[], divisions: number): Vector3[]
{
    if (points.length < 2) return points.slice();
    const result: Vector3[] = [];
    const n = points.length;
    // 首尾各补一个镜像点（非闭合样条边界处理）
    const p0 = points[0];
    const pn = points[n - 1];
    const first = new Vector3(2 * p0.x - points[1].x, 2 * p0.y - points[1].y, 2 * p0.z - points[1].z);
    const last = new Vector3(2 * pn.x - points[n - 2].x, 2 * pn.y - points[n - 2].y, 2 * pn.z - points[n - 2].z);
    const pts = [first, ...points, last];

    for (let i = 1; i < pts.length - 2; i++)
    {
        const a = pts[i - 1], b = pts[i], c = pts[i + 1], d = pts[i + 2];
        for (let j = 0; j <= divisions; j++)
        {
            if (i > 1 && j === 0) continue; // 避免段间重复点
            const t = j / divisions;
            const t2 = t * t, t3 = t2 * t;
            // Catmull-Rom 基矩阵（uniform，alpha=0）
            const x = 0.5 * ((2 * b.x) + (-a.x + c.x) * t + (2 * a.x - 5 * b.x + 4 * c.x - d.x) * t2 + (-a.x + 3 * b.x - 3 * c.x + d.x) * t3);
            const y = 0.5 * ((2 * b.y) + (-a.y + c.y) * t + (2 * a.y - 5 * b.y + 4 * c.y - d.y) * t2 + (-a.y + 3 * b.y - 3 * c.y + d.y) * t3);
            const z = 0.5 * ((2 * b.z) + (-a.z + c.z) * t + (2 * a.z - 5 * b.z + 4 * c.z - d.z) * t2 + (-a.z + 3 * b.z - 3 * c.z + d.z) * t3);
            result.push(new Vector3(x, y, z));
        }
    }

    return result;
}

// ---- 生成希尔伯特样条折线（对应原示例 spline） ----
const hilbertPoints = hilbert3D(new Vector3(0, 0, 0), 25.0, 1, 0, 1, 2, 3, 4, 5, 6, 7);
const SUBDIVISIONS = 6;
const splineSamples = catmullRomGetPoints(hilbertPoints, SUBDIVISIONS);

// 把连续折线（N 点）转成 line-list 连续 segment（N-1 段）
function polylineToSegments(pts: Vector3[], color: { __type__: 'Color4'; r: number; g: number; b: number; a: number }): SegmentGeometry['segments']
{
    const segments: SegmentGeometry['segments'] = [];
    for (let i = 0; i < pts.length - 1; i++)
    {
        segments.push({
            start: { x: pts[i].x, y: pts[i].y, z: pts[i].z },
            end: { x: pts[i + 1].x, y: pts[i + 1].y, z: pts[i + 1].z },
            startColor: color,
            endColor: color,
        });
    }

    return segments;
}

// 白色样条线（对应原示例 LineDashedMaterial color:0xffffff）
const WHITE = { __type__: 'Color4' as const, r: 1, g: 1, b: 1, a: 1 };
const splineSegments = polylineToSegments(splineSamples, WHITE);

// ---- 立方体边框（对应原示例 box(50,50,50)，橙色虚线 LineSegments） ----
// 12 条边作为独立 line-list segment（每边一对端点）
function boxEdgeSegments(size: number, color: { __type__: 'Color4'; r: number; g: number; b: number; a: number }): SegmentGeometry['segments']
{
    const h = size / 2;
    // 8 个顶点
    const v = [
        { x: -h, y: -h, z: -h }, { x: -h, y: h, z: -h }, { x: h, y: h, z: -h }, { x: h, y: -h, z: -h },
        { x: -h, y: -h, z: h }, { x: -h, y: h, z: h }, { x: h, y: h, z: h }, { x: h, y: -h, z: h },
    ];
    // 12 条边的顶点索引对
    const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    const segments: SegmentGeometry['segments'] = [];
    for (const [a, b] of edges)
    {
        segments.push({ start: v[a], end: v[b], startColor: color, endColor: color });
    }

    return segments;
}

// 橙色立方体边框（对应原示例 LineDashedMaterial color:0xffaa00）
const ORANGE = { __type__: 'Color4' as const, r: 1, g: 0.667, b: 0, a: 1 };
const boxSegments = boxEdgeSegments(50, ORANGE);

let lineRotation: { readonly x: number; readonly y: number; readonly z: number };
let boxRotation: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            // Scene.background = 0x111111
            background: { __type__: 'Color4', r: 0.067, g: 0.067, b: 0.067, a: 1 },
        }],
        children: [
            // 相机：PerspectiveCamera(60, aspect, 1, 200)，position.z=150，鼠标环绕缓动
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 0, z: 150 },
                components: [{
                    __type__: 'PerspectiveCamera',
                    fov: 60,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 1,
                    far: 200,
                }],
            },
            // 希尔伯特样条线（白色实线，虚线待实现）：旋转动画
            {
                __type__: 'Object3D',
                name: 'spline',
                rotation: lineRotation = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SegmentGeometry', segments: splineSegments } as SegmentGeometry,
                    material: { __type__: 'SegmentMaterial' } as SegmentMaterial,
                }],
            },
            // 立方体边框（橙色实线，虚线待实现）：旋转动画
            {
                __type__: 'Object3D',
                name: 'box',
                rotation: boxRotation = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SegmentGeometry', segments: boxSegments } as SegmentGeometry,
                    material: { __type__: 'SegmentMaterial' } as SegmentMaterial,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
const cameraObj = view.root!.children![0];
const origin = new Vector3(0, 0, 0);

// ---- 鼠标控制相机（替代原固定相机：鼠标移动 → 相机环绕中心缓动） ----
let targetAngleX = 0; let targetAngleY = 0;
window.addEventListener('mousemove', (event) =>
{
    targetAngleX = (event.clientX / window.innerWidth - 0.5) * Math.PI;
    targetAngleY = (event.clientY / window.innerHeight - 0.5) * Math.PI * 0.5;
});

const startTime = Date.now();

function animate(): void
{
    const time = (Date.now() - startTime) / 1000;
    // 线条旋转（对应原示例 object.rotation.x = 0.25*time, y = 0.25*time）
    reactive(lineRotation).x = 0.25 * time;
    reactive(lineRotation).y = 0.25 * time;
    reactive(boxRotation).x = 0.25 * time;
    reactive(boxRotation).y = 0.25 * time;

    // 相机环绕缓动
    const curPos = logic(cameraObj).position;
    const radius = 150;
    const curAngleX = Math.atan2(curPos.x, curPos.z);
    const newX = curAngleX + (targetAngleX - curAngleX) * 0.05;
    const curY = curPos.y;
    const newY = curY + (Math.sin(targetAngleY) * radius * 0.5 - curY) * 0.05;
    reactive(cameraObj).position = { x: Math.sin(newX) * radius, y: newY, z: Math.cos(newX) * radius };
    logic(cameraObj).lookAt(origin);

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

// 初始 lookAt
logic(cameraObj).lookAt(origin);
requestAnimationFrame(animate);
