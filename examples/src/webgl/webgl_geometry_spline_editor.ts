import { WebGPU } from '@feng3d/webgpu';
import {
    CubeGeometry, logic, Object3D, raycaster, Ray3, reactive, Scene,
    Segment, SegmentGeometry, SegmentMaterial, StandardMaterial, View, ticker,
} from 'feng3d';
import type { Camera } from 'feng3d';

/**
 * 样条曲线编辑器（Catmull-Rom + 控制点拖拽）。
 *
 * 对照 three.js：examples/webgl_geometry_spline_editor.html
 *
 * 原示例：CatmullRomCurve3 平滑曲线 + 控制点 TransformControls 拖拽 + 管道挤出。
 *
 * feng3d 适配（简化版）：
 * - CatmullRomCurve3 → 自写 Catmull-Rom 插值（~15 行纯数学）
 * - 曲线渲染 → SegmentGeometry + SegmentMaterial（逐段采样）
 * - 控制点 → CubeGeometry + StandardMaterial
 * - 控制点拖拽 → raycaster.pick 拾取 + 射线-平面投影
 * - 管道挤出省略（feng3d TubeGeometry 需要曲线对象，后续可扩展）
 * - TransformControls/GridHelper 省略
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- Catmull-Rom 插值（纯数学，对应 three.js CatmullRomCurve3.getPoint） ----
type Pt = { x: number; y: number; z: number };

function catmullRom(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt
{
    const t2 = t * t;
    const t3 = t2 * t;
    const f = (a: Pt, b: Pt, c: Pt, d: Pt) => 0.5 * (
        (2 * b.x) + (-a.x + c.x) * t + (2 * a.x - 5 * b.x + 4 * c.x - d.x) * t2 + (-a.x + 3 * b.x - 3 * c.x + d.x) * t3);

    return {
        x: f(p0, p1, p2, p3),
        y: f({ x: p0.y, y: 0, z: 0 } as Pt, { x: p1.y, y: 0, z: 0 } as Pt, { x: p2.y, y: 0, z: 0 } as Pt, { x: p3.y, y: 0, z: 0 } as Pt),
        z: f({ x: p0.z, y: 0, z: 0 } as Pt, { x: p1.z, y: 0, z: 0 } as Pt, { x: p2.z, y: 0, z: 0 } as Pt, { x: p3.z, y: 0, z: 0 } as Pt),
    };
}

/** 采样整条 Catmull-Rom 曲线（闭环），返回 points 个点 */
function sampleCatmullRom(ctrlPts: Pt[], samples: number): Pt[]
{
    const result: Pt[] = [];
    const n = ctrlPts.length;
    if (n < 2) return result;

    for (let i = 0; i < n; i++)
    {
        const p0 = ctrlPts[(i - 1 + n) % n];
        const p1 = ctrlPts[i];
        const p2 = ctrlPts[(i + 1) % n];
        const p3 = ctrlPts[(i + 2) % n];
        const segSamples = Math.floor(samples / n);
        for (let j = 0; j < segSamples; j++)
        {
            result.push(catmullRom(p0, p1, p2, p3, j / segSamples));
        }
    }

    return result;
}

// ---- 控制点（初始排布成波浪形） ----
const controlPoints: Pt[] = [];
const NUM_CTRL = 8;
const SPREAD = 300;
for (let i = 0; i < NUM_CTRL; i++)
{
    const t = i / (NUM_CTRL - 1);
    controlPoints.push({
        x: (t - 0.5) * SPREAD * 2,
        y: Math.sin(t * Math.PI * 2) * 80,
        z: Math.cos(t * Math.PI * 2) * 80,
    });
}

// ---- 构建控制点节点（可拾取的 Cube） ----
const ctrlNodes: Object3D[] = [];
for (let i = 0; i < NUM_CTRL; i++)
{
    const p = controlPoints[i];
    ctrlNodes.push({
        __type__: 'Object3D',
        name: `ctrl_${i}`,
        position: { x: p.x, y: p.y, z: p.z },
        rotation: { x: 0, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry', width: 15, height: 15, depth: 15 } as CubeGeometry,
            material: {
                __type__: 'StandardMaterial',
                uniforms: {
                    u_diffuse: { __type__: 'Color4', r: 1, g: 0.6, b: 0.2, a: 1 },
                    u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                    u_glossiness: 0, u_reflectivity: 0,
                },
            },
        }],
    });
}

// ---- 曲线段（每帧根据控制点重算） ----
const curveSegments: Segment[] = [];

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.15, g: 0.15, b: 0.15, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 200, z: 500 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [
                    {
                        __type__: 'PerspectiveCamera', fov: 45,
                        aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 2000,
                    },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } },
                ],
            },
            {
                __type__: 'Object3D', name: 'dirLight', position: { x: 0.5, y: 1, z: 0.5 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 1,
                }],
            },
            // 曲线（青色）
            {
                __type__: 'Object3D', name: 'curve',
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SegmentGeometry', segments: curveSegments } as SegmentGeometry,
                    material: { __type__: 'SegmentMaterial' } as SegmentMaterial,
                }],
            },
            ...ctrlNodes,
        ],
    },
};

const viewLogic = logic(view);

// ---- 重建曲线段（控制点变化后调用） ----
function rebuildCurve()
{
    const samples = sampleCatmullRom(controlPoints, 100);
    // 更新 segments 数组
    curveSegments.length = 0;
    for (let i = 0; i < samples.length; i++)
    {
        const a = samples[i];
        const b = samples[(i + 1) % samples.length];
        curveSegments.push({
            start: { x: a.x, y: a.y, z: a.z },
            end: { x: b.x, y: b.y, z: b.z },
            startColor: { __type__: 'Color4', r: 0.3, g: 1, b: 1, a: 1 },
            endColor: { __type__: 'Color4', r: 0.3, g: 1, b: 1, a: 1 },
        });
    }
    // 触发 SegmentGeometry 重算（segments 引用变化）
    const curveNode = view.root!.children![2];
    const geo = (curveNode.components![0] as { geometry: SegmentGeometry }).geometry;
    reactive(geo).segments = curveSegments.concat();
}
rebuildCurve();

// ---- 拖拽控制点 ----
const camera = view.root!.children![0].components![0] as unknown as Camera;
let dragging: { node: Object3D; index: number } | null = null;
let mouseX = 0;
let mouseY = 0;

webgpuCanvas.addEventListener('pointerdown', (e: PointerEvent) =>
{
    const rect = webgpuCanvas.getBoundingClientRect();
    const gx = (e.clientX - rect.left) / rect.width;
    const gy = (e.clientY - rect.top) / rect.height;
    const camLogic = logic(camera);
    const ray = camLogic.getRay3D?.(gx, gy) as Ray3 | undefined;
    if (!ray) return;

    const hit = raycaster.pick(ray, ctrlNodes);
    if (hit)
    {
        // 找到被拾取的控制点索引
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hitEntity = (hit as any).entity ?? (hit as any).object3D;
        const idx = ctrlNodes.indexOf(hitEntity as Object3D);
        if (idx >= 0)
        {
            // OrbitControls 旋转可能与拖拽冲突，按下时记录
            dragging = { node: ctrlNodes[idx], index: idx };
        }
    }
});

webgpuCanvas.addEventListener('pointermove', (e: PointerEvent) =>
{
    const rect = webgpuCanvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / rect.width;
    mouseY = (e.clientY - rect.top) / rect.height;
    if (!dragging) return;

    const camLogic = logic(camera);
    const ray = camLogic.getRay3D?.(mouseX, mouseY) as Ray3 | undefined;
    if (!ray) return;

    // 射线与 y=controlPoints[index].y 水平面求交
    const py = controlPoints[dragging.index].y;
    const dy = py - ray.origin.y;
    const t = dy / ray.direction.y;
    if (t > 0 && t < 10000)
    {
        const x = ray.origin.x + ray.direction.x * t;
        const z = ray.origin.z + ray.direction.z * t;
        controlPoints[dragging.index] = { x, y: py, z };
        reactive(dragging.node).position = { x, y: py, z };
        rebuildCurve();
    }
});

webgpuCanvas.addEventListener('pointerup', () =>
{
    dragging = null;
});

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
