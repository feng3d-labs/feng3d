import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, Segment, SegmentGeometry, SegmentMaterial, View, ticker } from 'feng3d';

/**
 * Gosper 曲线分形彩色线段。
 *
 * 对照 three.js：examples/webgl_framebuffer_texture.html
 *
 * 原示例用 Gosper 空间填充曲线生成彩色 LineSegments。feng3d 用 SegmentGeometry 替代。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- Gosper 曲线生成器（L-system 展开） ----
// 产生点序列，每个点带颜色
type GPoint = { x: number; y: number; z: number; r: number; g: number; b: number };

function gosper(order: number, scale: number): GPoint[]
{
    const points: GPoint[] = [];
    // L-system: A → A-B--B+A++AA+-, B → +A-BB--B-A++A+B
    let str = 'A';
    const rules: Record<string, string> = {
        A: 'A-B--B+A++AA+-',
        B: '+A-BB--B-A++A+B',
    };
    for (let i = 0; i < order; i++)
    {
        str = str.split('').map(c => rules[c] ?? c).join('');
    }
    // 解释
    let x = 0;
    let y = 0;
    let angle = 0;
    const step = scale;
    const turn = Math.PI / 3;
    let idx = 0;

    for (const c of str)
    {
        if (c === 'A' || c === 'B')
        {
            const nx = x + Math.cos(angle) * step;
            const ny = y + Math.sin(angle) * step;
            const hue = (idx * 0.1) % 1;
            const rgb = hslToRgb(hue, 1, 0.5);
            points.push({ x: nx, y: ny, z: 0, r: rgb[0], g: rgb[1], b: rgb[2] });
            x = nx;
            y = ny;
            idx++;
        }
        else if (c === '+') angle += turn;
        else if (c === '-') angle -= turn;
    }

    return points;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number]
{
    const hue2rgb = (p: number, q: number, t: number) =>
    {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 0.5) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;

        return p;
    };
    if (s === 0) return [l, l, l];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

const gosperPoints = gosper(4, 1.5);
const segments: Segment[] = [];
for (let i = 0; i < gosperPoints.length - 1; i++)
{
    const a = gosperPoints[i];
    const b = gosperPoints[i + 1];
    segments.push({
        start: { x: a.x, y: a.y, z: 0 },
        end: { x: b.x, y: b.y, z: 0 },
        startColor: { __type__: 'Color4', r: a.r, g: a.g, b: a.b, a: 1 },
        endColor: { __type__: 'Color4', r: b.r, g: b.g, b: b.b, a: 1 },
    });
}

let groupRot: { x: number; y: number; z: number };

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
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 120 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'PerspectiveCamera', fov: 60,
                    aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 1000,
                },
                { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, autoRotate: true, autoRotateSpeed: 0.5 }],
            },
            {
                __type__: 'Object3D', name: 'gosper',
                rotation: groupRot = { x: 0, y: 0, z: 0 },
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

ticker.onframe(() =>
{
    reactive(groupRot).z += 0.002;
    webgpu.submit(viewLogic.submit);
});
