import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, SegmentGeometry, SegmentMaterial, View } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_buffergeometry_lines.html。
 *
 * 原示例：10000 个随机点连成一条连续折线（THREE.Line = line-strip），顶点色按位置着色，
 * PerspectiveCamera(27, aspect, 1, 4000) position.z=2750，每帧旋转 line（x +time*0.25, y +time*0.5），
 * 并用 morphTargetInfluences 在两组随机点位置间正弦插值。
 *
 * feng3d 适配：
 * - THREE.Line（line-strip 连续折线）→ SegmentGeometry（line-list 独立线段）：feng3d 无 line-strip
 *   材质，把 N 个点折线拆成 N-1 个连续 segment（点 i 的 start=点 i，end=点 i+1），相邻 segment
 *   共享端点，视觉上等价一条折线。
 * - LineBasicMaterial{vertexColors:true} → SegmentMaterial（line-list 拓扑），顶点色由每段端点的
 *   startColor/endColor 承载（按位置着色：(x/r+0.5, y/r+0.5, z/r+0.5)）。
 * - morphTargetInfluences（变形目标）：feng3d 暂不支持变形动画，省略（点位置固定，仅保留旋转动画）。
 * - setAnimationLoop → requestAnimationFrame（与其他移植示例一致）。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- 生成随机折线（对应原示例 10000 点） ----
const SEGMENTS = 10000;
const R = 800;
const segments: SegmentGeometry['segments'] = [];
// 先生成所有点 + 颜色，再两两配对成连续 segment（折线 → line-list）
const pts: { x: number; y: number; z: number; c: { __type__: 'Color4'; r: number; g: number; b: number; a: number } }[] = [];
for (let i = 0; i < SEGMENTS; i++)
{
    const x = Math.random() * R - R / 2;
    const y = Math.random() * R - R / 2;
    const z = Math.random() * R - R / 2;
    pts.push({
        x, y, z,
        c: { __type__: 'Color4', r: x / R + 0.5, g: y / R + 0.5, b: z / R + 0.5, a: 1 },
    });
}
// 连续折线：点 i → 点 i+1（N-1 段）
for (let i = 0; i < pts.length - 1; i++)
{
    const a = pts[i], b = pts[i + 1];
    segments.push({ start: { x: a.x, y: a.y, z: a.z }, end: { x: b.x, y: b.y, z: b.z }, startColor: a.c, endColor: b.c });
}

let lineRotation: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            // 原示例 Scene 无背景设置，默认黑
            background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
        }],
        children: [
            // 相机：PerspectiveCamera(27, aspect, 1, 4000)，position.z=2750
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 0, z: 2750 },
                components: [{
                    __type__: 'PerspectiveCamera',
                    fov: 27,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 1,
                    far: 4000,
                }],
            },
            // 折线 mesh：旋转动画（rotation.x = time*0.25, rotation.y = time*0.5）
            {
                __type__: 'Object3D',
                name: 'line',
                rotation: lineRotation = { x: 0, y: 0, z: 0 },
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

// ---- animate（对应原示例 setAnimationLoop + 每帧旋转） ----
const startTime = Date.now();

function animate(): void
{
    const time = (Date.now() - startTime) / 1000;
    reactive(lineRotation).x = time * 0.25;
    reactive(lineRotation).y = time * 0.5;

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
