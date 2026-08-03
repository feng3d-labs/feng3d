import { WebGPU } from '@feng3d/webgpu';
import {
    logic, Object3D, PointGeometry, PointMaterial, reactive, Scene,
    Segment, SegmentGeometry, SegmentMaterial, View, Vector3, Vector4, ticker,
} from 'feng3d';
import { NURBSCurve } from '@feng3d/addons';

/**
 * NURBS 曲线展示（控制点 + 控制多边形 + 曲线）。
 *
 * 对照 three.js：examples/webgl_geometry_nurbs.html
 *
 * 原示例：NURBSCurve 生成 3D 曲线，用 Line 渲染曲线、Line 渲染控制多边形、
 * Points 渲染控制点，整体绕 Y 轴旋转。
 *
 * feng3d 适配：
 * - NURBSCurve（addons/curves）→ getPoints 采样
 * - Line + LineBasicMaterial → SegmentGeometry + SegmentMaterial（line-list 拆段）
 * - Points + PointsMaterial → PointGeometry + PointMaterial
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- 定义 NURBS 曲线（对应原示例的 nsCurve 参数） ----
// 控制点（x, y, z, w）
const controlPoints: Vector4[] = [
    new Vector4(-100, -40, -100, 1),
    new Vector4(-100, 100, -100, 1),
    new Vector4(-100, 40, 100, 1),
    new Vector4(100, 100, 100, 1),
    new Vector4(100, -40, -100, 1),
    new Vector4(-100, 40, -100, 1),
    new Vector4(-100, 100, 100, 1),
    new Vector4(100, 40, 100, 1),
    new Vector4(100, -40, -100, 1),
];
// 节点向量（degree=3，clamped）
const knots = [0, 0, 0, 0, 0.25, 0.5, 0.75, 1, 1, 1, 1, 1];
const nurbsCurve = new NURBSCurve(3, knots, controlPoints, 0, knots.length - 1);

// 采样曲线点
const curvePoints = nurbsCurve.getPoints(100);

// ---- 构建 SegmentGeometry：曲线（连续段） ----
const curveSegments: Segment[] = [];
for (let i = 0; i < curvePoints.length - 1; i++)
{
    const a = curvePoints[i];
    const b = curvePoints[i + 1];
    curveSegments.push({
        start: { x: a.x, y: a.y, z: a.z },
        end: { x: b.x, y: b.y, z: b.z },
        startColor: { __type__: 'Color4', r: 0.4, g: 1, b: 1, a: 1 },
        endColor: { __type__: 'Color4', r: 0.4, g: 1, b: 1, a: 1 },
    });
}

// ---- 控制多边形（虚线样，灰色） ----
const hullSegments: Segment[] = [];
for (let i = 0; i < controlPoints.length - 1; i++)
{
    const a = controlPoints[i];
    const b = controlPoints[i + 1];
    hullSegments.push({
        start: { x: a.x, y: a.y, z: a.z },
        end: { x: b.x, y: b.y, z: b.z },
        startColor: { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 },
        endColor: { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 },
    });
}

// ---- 控制点（PointGeometry） ----
const controlPointInfos: PointGeometry['points'] = controlPoints.map(p => ({
    position: { x: p.x, y: p.y, z: p.z },
    color: { __type__: 'Color4', r: 1, g: 0.5, b: 0, a: 1 },
}));

// ---- 旋转状态 ----
let groupRot: { x: number; y: number; z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 400 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [
                    {
                        __type__: 'PerspectiveCamera', fov: 45,
                        aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 2000,
                    },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } },
                ],
            },
            // 旋转组
            {
                __type__: 'Object3D', name: 'group',
                rotation: groupRot = { x: 0, y: 0, z: 0 },
                children: [
                    // NURBS 曲线（青色）
                    {
                        __type__: 'Object3D', name: 'curve',
                        components: [{
                            __type__: 'MeshRenderer',
                            geometry: { __type__: 'SegmentGeometry', segments: curveSegments } as SegmentGeometry,
                            material: { __type__: 'SegmentMaterial' } as SegmentMaterial,
                        }],
                    },
                    // 控制多边形（灰色）
                    {
                        __type__: 'Object3D', name: 'hull',
                        components: [{
                            __type__: 'MeshRenderer',
                            geometry: { __type__: 'SegmentGeometry', segments: hullSegments } as SegmentGeometry,
                            material: { __type__: 'SegmentMaterial' } as SegmentMaterial,
                        }],
                    },
                    // 控制点（橙色）
                    {
                        __type__: 'Object3D', name: 'controlPoints',
                        components: [{
                            __type__: 'MeshRenderer',
                            geometry: { __type__: 'PointGeometry', points: controlPointInfos } as PointGeometry,
                            material: {
                                __type__: 'PointMaterial',
                                uniforms: {
                                    u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                                    u_PointSize: 12,
                                },
                            } as PointMaterial,
                        }],
                    },
                ],
            },
        ],
    },
};

const viewLogic = logic(view);

ticker.onframe(() =>
{
    reactive(groupRot).y += 0.003;
    webgpu.submit(viewLogic.submit);
});
