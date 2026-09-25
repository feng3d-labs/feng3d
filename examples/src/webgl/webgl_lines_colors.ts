import { WebGPU } from '@feng3d/webgpu';
import { Vector3 } from '@feng3d/math';
import { logic, Object3D, reactive, Scene, SegmentGeometry, SegmentMaterial, View } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_lines_colors.html。
 *
 * 原示例：Hilbert 3D 曲线经 CatmullRom 平滑后画 3 条彩色折线（不同 HSL 着色），
 * 加 8 个角点的离散线段。鼠标控制相机移动。
 *
 * feng3d 适配：
 * - hilbert3D + CatmullRomCurve3：内联实现（纯数学）。
 * - THREE.Line（line-strip）→ SegmentGeometry（line-list）：折线拆成连续段。
 * - LineBasicMaterial{vertexColors} → SegmentMaterial（端点色）。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- hilbert3D（移植自 three.js GeometryUtils.hilbert3D） ----
function hilbert3D(center: Vector3, size: number, iterations: number, v0: number, v1: number, v2: number, v3: number, v4: number, v5: number, v6: number, v7: number): Vector3[]
{
    const half = size / 2;
    const vec_s = [
        new Vector3(center.x - half, center.y + half, center.z - half),
        new Vector3(center.x - half, center.y + half, center.z + half),
        new Vector3(center.x - half, center.y - half, center.z + half),
        new Vector3(center.x - half, center.y - half, center.z - half),
        new Vector3(center.x + half, center.y - half, center.z - half),
        new Vector3(center.x + half, center.y - half, center.z + half),
        new Vector3(center.x + half, center.y + half, center.z + half),
        new Vector3(center.x + half, center.y + half, center.z - half),
    ];
    const vec = [vec_s[v0], vec_s[v1], vec_s[v2], vec_s[v3], vec_s[v4], vec_s[v5], vec_s[v6], vec_s[v7]];
    if (--iterations >= 0)
    {
        return [
            ...hilbert3D(vec[0], half, iterations, v0, v3, v4, v7, v6, v5, v2, v1),
            ...hilbert3D(vec[1], half, iterations, v0, v7, v6, v1, v2, v5, v4, v3),
            ...hilbert3D(vec[2], half, iterations, v0, v7, v6, v1, v2, v5, v4, v3),
            ...hilbert3D(vec[3], half, iterations, v2, v3, v0, v1, v6, v7, v4, v5),
            ...hilbert3D(vec[4], half, iterations, v2, v3, v0, v1, v6, v7, v4, v5),
            ...hilbert3D(vec[5], half, iterations, v4, v3, v2, v5, v6, v1, v0, v7),
            ...hilbert3D(vec[6], half, iterations, v4, v3, v2, v5, v6, v1, v0, v7),
            ...hilbert3D(vec[7], half, iterations, v6, v5, v2, v1, v0, v3, v4, v7),
        ];
    }

    return vec;
}

// ---- HSL→RGB ----
function hslToRgb(h: number, s: number, l: number): [number, number, number]
{
    if (s === 0) return [l, l, l];
    const hue2rgb = (p: number, q: number, t: number) =>
    {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

// ---- 生成 Hilbert 曲线点 + CatmullRom 平滑 ----
const hilbertPoints = hilbert3D(new Vector3(0, 0, 0), 200.0, 1, 0, 1, 2, 3, 4, 5, 6, 7);
const SUBDIV = 6;
const smoothPoints: Vector3[] = [];
// 简化 CatmullRom：直接在 hilbert 点间线性插值（避免引入完整 CatmullRom 依赖）
for (let i = 0; i < hilbertPoints.length; i++)
{
    const p0 = hilbertPoints[Math.max(0, i - 1)];
    const p1 = hilbertPoints[i];
    const p2 = hilbertPoints[Math.min(hilbertPoints.length - 1, i + 1)];
    const p3 = hilbertPoints[Math.min(hilbertPoints.length - 1, i + 2)];
    for (let s = 0; s < SUBDIV; s++)
    {
        const t = s / SUBDIV;
        // Catmull-Rom 插值
        const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t * t + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t * t * t);
        const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t * t + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t * t * t);
        const z = 0.5 * ((2 * p1.z) + (-p0.z + p2.z) * t + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t * t + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t * t * t);
        smoothPoints.push(new Vector3(x, y, z));
    }
}

// ---- 构建 3 条彩色折线的 SegmentGeometry ----
function buildLineSegments(points: Vector3[], colorFn: (p: Vector3, i: number) => [number, number, number]): SegmentGeometry['segments']
{
    const segs: SegmentGeometry['segments'] = [];
    for (let i = 0; i < points.length - 1; i++)
    {
        const a = points[i], b = points[i + 1];
        const ca = colorFn(a, i);
        const cb = colorFn(b, i + 1);
        segs.push({
            start: { x: a.x, y: a.y, z: a.z }, end: { x: b.x, y: b.y, z: b.z },
            startColor: { __type__: 'Color4', r: ca[0], g: ca[1], b: ca[2], a: 1 },
            endColor: { __type__: 'Color4', r: cb[0], g: cb[1], b: cb[2], a: 1 },
        });
    }

    return segs;
}

const total = smoothPoints.length;
const line1: SegmentGeometry['segments'] = buildLineSegments(smoothPoints, (p) => hslToRgb(0.6, 1.0, Math.max(0, -p.x / 200) + 0.5));
const line2: SegmentGeometry['segments'] = buildLineSegments(smoothPoints, (p) => hslToRgb(0.9, 1.0, Math.max(0, -p.y / 200) + 0.5));
const line3: SegmentGeometry['segments'] = buildLineSegments(smoothPoints, (_p, i) => hslToRgb(i / total, 1.0, 0.5));

let camPos: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: camPos = { x: 0, y: 0, z: 1000 },
                components: [{
                    __type__: 'PerspectiveCamera',
                    fov: 33,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 1,
                    far: 10000,
                }],
            },
            // 3 条彩色折线（轻微偏移避免重叠）
            {
                __type__: 'Object3D',
                name: 'line1',
                position: { x: 0, y: 5, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SegmentGeometry', segments: line1 } as SegmentGeometry,
                    material: { __type__: 'SegmentMaterial' } as SegmentMaterial,
                }],
            },
            {
                __type__: 'Object3D',
                name: 'line2',
                position: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SegmentGeometry', segments: line2 } as SegmentGeometry,
                    material: { __type__: 'SegmentMaterial' } as SegmentMaterial,
                }],
            },
            {
                __type__: 'Object3D',
                name: 'line3',
                position: { x: 0, y: -5, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SegmentGeometry', segments: line3 } as SegmentGeometry,
                    material: { __type__: 'SegmentMaterial' } as SegmentMaterial,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
const cameraObj = view.root!.children![0];

let targetX = 0, targetY = 0;
window.addEventListener('mousemove', (e) =>
{
    targetX = e.clientX - window.innerWidth / 2;
    targetY = e.clientY - window.innerHeight / 2;
});

function animate(): void
{
    const cur = logic(cameraObj).position;
    reactive(cameraObj).position = {
        x: cur.x + (targetX - cur.x) * 0.05,
        y: cur.y + (-targetY - cur.y) * 0.05,
        z: 1000,
    };

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
