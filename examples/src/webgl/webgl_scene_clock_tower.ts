import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';
import type { Segment, SegmentGeometry, SegmentMaterial } from 'feng3d';

/** 钟楼（CylinderGeometry 塔身 + 表盘 + 时分秒指针，用 Date 时间驱动）。 */
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 12 个小时刻度（XY 平面，钟面朝 +Z）
const tickSegs: Segment[] = [];
for (let i = 0; i < 12; i++)
{
    const a = (i / 12) * 6.28;
    tickSegs.push({ start: { x: Math.cos(a) * 38, y: Math.sin(a) * 38, z: 0 }, end: { x: Math.cos(a) * 45, y: Math.sin(a) * 45, z: 0 }, startColor: { __type__: 'Color4', r: 0.9, g: 0.9, b: 0.9, a: 1 }, endColor: { __type__: 'Color4', r: 0.9, g: 0.9, b: 0.9, a: 1 } });
}
// 三根指针：起点在中心、末端指向 +Y，绕 Z 轴旋转到对应时刻
const hourSeg: Segment = { start: { x: 0, y: 0, z: 0.3 }, end: { x: 0, y: 22, z: 0.3 }, startColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, endColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } };
const minSeg: Segment = { start: { x: 0, y: 0, z: 0.4 }, end: { x: 0, y: 33, z: 0.4 }, startColor: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 }, endColor: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 } };
const secSeg: Segment = { start: { x: 0, y: 0, z: 0.5 }, end: { x: 0, y: 40, z: 0.5 }, startColor: { __type__: 'Color4', r: 1, g: 0.3, b: 0.3, a: 1 }, endColor: { __type__: 'Color4', r: 1, g: 0.3, b: 0.3, a: 1 } };

let hr: { x: number; y: number; z: number };
let mr: { x: number; y: number; z: number };
let sr: { x: number; y: number; z: number };
const v: View = {
    __type__: 'View', canvas: wc,
    root: {
        __type__: 'Object3D', name: 'U',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.08, g: 0.08, b: 0.1, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.7, g: 0.7, b: 0.7, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 30, z: 200 }, rotation: { x: 0, y: 0, z: 0 }, components: [{ __type__: 'PerspectiveCamera', fov: 45, aspect: wc.width / wc.height, near: 1, far: 1000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'dl', position: { x: 0.5, y: 0.5, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] },
            // 塔身（CylinderGeometry 沿 Y 轴，下粗上细）
            { __type__: 'Object3D', name: 'tower', position: { x: 0, y: -70, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CylinderGeometry', topRadius: 40, bottomRadius: 55, height: 120, segmentsW: 48 }, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.3, g: 0.25, b: 0.2, a: 1 }, u_specular: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.2, a: 1 }, u_glossiness: 20, u_reflectivity: 0 } } }] },
            // 表盘（薄圆柱，钟面朝 +Z：把沿 Y 轴的圆柱绕 X 轴转 90°）
            { __type__: 'Object3D', name: 'dial', position: { x: 0, y: 0, z: 0 }, rotation: { x: 1.5708, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CylinderGeometry', topRadius: 50, bottomRadius: 50, height: 6, segmentsW: 48 }, material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.9, g: 0.88, b: 0.75, a: 1 }, u_specular: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 }, u_glossiness: 50, u_reflectivity: 0 } } }] },
            // 刻度（贴在表盘前侧）
            { __type__: 'Object3D', name: 'ticks', position: { x: 0, y: 0, z: 3.1 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SegmentGeometry', segments: tickSegs } as SegmentGeometry, material: { __type__: 'SegmentMaterial' } as SegmentMaterial }] },
            // 指针（绕 Z 轴旋转，分别对应时分秒）
            { __type__: 'Object3D', name: 'hour', position: { x: 0, y: 0, z: 3.2 }, rotation: hr = { x: 0, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SegmentGeometry', segments: [hourSeg] } as SegmentGeometry, material: { __type__: 'SegmentMaterial' } as SegmentMaterial }] },
            { __type__: 'Object3D', name: 'min', position: { x: 0, y: 0, z: 3.3 }, rotation: mr = { x: 0, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SegmentGeometry', segments: [minSeg] } as SegmentGeometry, material: { __type__: 'SegmentMaterial' } as SegmentMaterial }] },
            { __type__: 'Object3D', name: 'sec', position: { x: 0, y: 0, z: 3.4 }, rotation: sr = { x: 0, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SegmentGeometry', segments: [secSeg] } as SegmentGeometry, material: { __type__: 'SegmentMaterial' } as SegmentMaterial }] },
        ],
    },
};
const vl = logic(v);
ticker.onframe(() => { const n = new Date(); reactive(hr).z = -((n.getHours() % 12 + n.getMinutes() / 60) / 12) * 6.28; reactive(mr).z = -((n.getMinutes() + n.getSeconds() / 60) / 60) * 6.28; reactive(sr).z = -((n.getSeconds() + n.getMilliseconds() / 1000) / 60) * 6.28; webgpu.submit(vl.submit); });
