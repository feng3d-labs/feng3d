import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, Segment, SegmentGeometry, SegmentMaterial, View, ticker } from 'feng3d';

/**
 * 球面线段放射（选择性绘制演示）。
 *
 * 对照 three.js：examples/webgl_buffergeometry_selective_draw.html
 *
 * 原示例：球面上 numLat×numLng 条线段从球心放射到球面，每条带逐顶点可见性属性 visible，
 * 自定义 shader 里 if(visible>0) emit color else discard；按钮随机剔除 25% 线段。
 *
 * feng3d 适配：
 * - LineSegments + 自定义 shader discard → SegmentGeometry + SegmentMaterial，
 *   通过把被剔除段的颜色 alpha 设为 0（SegmentMaterial 支持 alpha 混合）实现"隐藏"，
 *   视觉效果与 discard 等价（线段透明不可见），单 draw call 不变
 * - 逐顶点 HSL 着色（纬度→色相）
 * - 按钮点击随机剔除/恢复
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- 参数 ----
const NUM_LAT = 100;
const NUM_LNG = 200;
const RADIUS = 80;

/** HSL → RGB（对应 three.js Color.setHSL） */
function hslToRgb(h: number, s: number, l: number): [number, number, number]
{
    const hue2rgb = (p: number, q: number, t: number) =>
    {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;

        return p;
    };
    if (s === 0) return [l, l, l];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

// ---- 构建线段（SegmentGeometry 声明式 segments） ----
const segments: Segment[] = [];
// 记录每条线段两端的基础颜色（未剔除时用），用于恢复
const baseColors: { r0: number; g0: number; b0: number; r1: number; g1: number; b1: number }[] = [];
let numCulled = 0;

for (let i = 0; i < NUM_LAT; i++)
{
    for (let j = 0; j < NUM_LNG; j++)
    {
        const lat = (Math.random() * Math.PI) / 50 + i / NUM_LAT * Math.PI;
        const lng = (Math.random() * Math.PI) / 50 + j / NUM_LNG * 2 * Math.PI;

        const ex = RADIUS * Math.sin(lat) * Math.cos(lng);
        const ey = RADIUS * Math.cos(lat);
        const ez = RADIUS * Math.sin(lat) * Math.sin(lng);

        const [r0, g0, b0] = hslToRgb(lat / Math.PI, 1.0, 0.2);
        const [r1, g1, b1] = hslToRgb(lat / Math.PI, 1.0, 0.7);

        baseColors.push({ r0, g0, b0, r1, g1, b1 });
        segments.push({
            start: { x: 0, y: 0, z: 0 },
            end: { x: ex, y: ey, z: ez },
            startColor: { __type__: 'Color4', r: r0, g: g0, b: b0, a: 1 },
            endColor: { __type__: 'Color4', r: r1, g: g1, b: b1, a: 1 },
        });
    }
}

// 旋转状态
let sphereRot: { x: number; y: number; z: number };

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
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 320 },
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
                __type__: 'Object3D', name: 'linesphere',
                rotation: sphereRot = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'SegmentGeometry', segments } as SegmentGeometry,
                    material: { __type__: 'SegmentMaterial' } as SegmentMaterial,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);

// ---- 随机剔除/恢复线段 ----
const infoEl = document.getElementById('info');

function updateInfo()
{
    if (infoEl)
    {
        infoEl.textContent = `球面线段（1 draw call, ${NUM_LAT * NUM_LNG} 条线, ${numCulled} 已剔除）| 点击按钮随机剔除/恢复 | OrbitControls`;
    }
}

function hideRandomLines()
{
    // 随机剔除约 25% 的可见线段（alpha=0）
    for (let i = 0; i < segments.length; i++)
    {
        if (Math.random() < 0.25 && segments[i].startColor.a > 0)
        {
            reactive(segments[i]).startColor = { __type__: 'Color4', r: 0, g: 0, b: 0, a: 0 };
            reactive(segments[i]).endColor = { __type__: 'Color4', r: 0, g: 0, b: 0, a: 0 };
            numCulled++;
        }
    }
    updateInfo();
}

function showAllLines()
{
    for (let i = 0; i < segments.length; i++)
    {
        const bc = baseColors[i];
        reactive(segments[i]).startColor = { __type__: 'Color4', r: bc.r0, g: bc.g0, b: bc.b0, a: 1 };
        reactive(segments[i]).endColor = { __type__: 'Color4', r: bc.r1, g: bc.g1, b: bc.b1, a: 1 };
    }
    numCulled = 0;
    updateInfo();
}

// 按钮
const btnHide = document.getElementById('btnHide');
const btnShow = document.getElementById('btnShow');
btnHide?.addEventListener('click', hideRandomLines);
btnShow?.addEventListener('click', showAllLines);
updateInfo();

ticker.onframe(() =>
{
    reactive(sphereRot).y += 0.002;
    webgpu.submit(viewLogic.submit);
});
