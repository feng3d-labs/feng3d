import { WebGPU } from '@feng3d/webgpu';
import { Vector3 } from '@feng3d/math';
import { logic, Object3D, reactive, Scene, SegmentGeometry, SegmentMaterial, View } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_buffergeometry_lines_indexed.html。
 *
 * 原示例：用索引线段（LineSegments + indices）画 Koch 雪花曲线（分形），顶点色随机，
 * 鼠标控制相机。展示索引线段几何体。
 *
 * feng3d 适配：
 * - LineSegments + indices → SegmentGeometry（line-list，每段独立 start/end）。
 * - Koch 雪花算法内联（纯数学递归）。
 * - LineBasicMaterial{vertexColors} → SegmentMaterial（端点色）。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- Koch 雪花曲线生成 ----
const segments: SegmentGeometry['segments'] = [];
const RANGLE = 60 * Math.PI / 180.0;
const ITER = 4;

function randomColor(): { __type__: 'Color4'; r: number; g: number; b: number; a: number }
{
    return { __type__: 'Color4', r: Math.random() * 0.5 + 0.5, g: Math.random() * 0.5 + 0.5, b: 1, a: 1 };
}

function addLine(p0: Vector3, p4: Vector3): void
{
    segments.push({
        start: { x: p0.x, y: p0.y, z: p0.z },
        end: { x: p4.x, y: p4.y, z: p4.z },
        startColor: randomColor(),
        endColor: randomColor(),
    });
}

function snowflake(p0: Vector3, p4: Vector3, depth: number): void
{
    if (--depth < 0) { addLine(p0, p4); return; }
    const v = p4.sub(p0);
    const vt = v.scaleNumber(1 / 3);
    const p1 = p0.add(vt);
    const p3 = p0.add(vt.scaleNumber(2));
    // p2 = p1 旋转 RANGLE
    const p2 = new Vector3(
        p1.x + vt.x * Math.cos(RANGLE) - vt.y * Math.sin(RANGLE),
        p1.y + vt.x * Math.sin(RANGLE) + vt.y * Math.cos(RANGLE),
        p1.z,
    );
    snowflake(p0, p1, depth);
    snowflake(p1, p2, depth);
    snowflake(p2, p3, depth);
    snowflake(p3, p4, depth);
}

// 3 条边构成雪花三角形
const s = 3000;
const p0 = new Vector3(0, s * 0.6, 0);
const p1 = new Vector3(-s * 0.5, -s * 0.3, 0);
const p2 = new Vector3(s * 0.5, -s * 0.3, 0);
snowflake(p0, p1, ITER);
snowflake(p1, p2, ITER);
snowflake(p2, p0, ITER);

let lineRot: { readonly x: number; readonly y: number; readonly z: number };

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
                position: { x: 0, y: 0, z: 9000 },
                components: [{
                    __type__: 'PerspectiveCamera',
                    fov: 27,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 1,
                    far: 10000,
                }],
            },
            {
                __type__: 'Object3D',
                name: 'snowflake',
                rotation: lineRot = { x: 0, y: 0, z: 0 },
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
const lineObj = view.root!.children![1];

let targetX = 0, targetY = 0;
window.addEventListener('mousemove', (e) =>
{
    targetX = e.clientX - window.innerWidth / 2;
    targetY = e.clientY - window.innerHeight / 2;
});

function animate(): void
{
    const t = Date.now() * 0.001;
    reactive(lineRot).x = t * 0.25;
    reactive(lineRot).y = t * 0.5;

    const cam = logic(view.root!.children![0]).position;
    reactive(view.root!.children![0]).position = {
        x: cam.x + (targetX - cam.x) * 0.05,
        y: cam.y + (-targetY - cam.y) * 0.05,
        z: 9000,
    };

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
