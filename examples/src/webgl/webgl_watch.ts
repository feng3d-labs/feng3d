import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, Segment, SegmentGeometry, SegmentMaterial, View, ticker } from 'feng3d';

/**
 * 程序化手表（时钟表盘 + 指针）。
 *
 * 对照 three.js：examples/webgl_watch.html
 * 表盘（CylinderGeometry 扁平圆柱）+ 刻度线（SegmentGeometry）+ 时分秒针（SegmentGeometry）。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 表盘刻度
const tickSegments: Segment[] = [];
for (let i = 0; i < 12; i++)
{
    const a = (i / 12) * Math.PI * 2;
    const r1 = i % 3 === 0 ? 85 : 92;
    const r2 = 100;
    tickSegments.push({
        start: { x: Math.cos(a) * r1, y: Math.sin(a) * r1, z: 0.1 },
        end: { x: Math.cos(a) * r2, y: Math.sin(a) * r2, z: 0.1 },
        startColor: { __type__: 'Color4', r: 0.9, g: 0.9, b: 0.9, a: 1 },
        endColor: { __type__: 'Color4', r: 0.9, g: 0.9, b: 0.9, a: 1 },
    });
}

// 动态指针（时/分/秒）
const hourSeg: Segment = { start: { x: 0, y: 0, z: 0.2 }, end: { x: 0, y: 50, z: 0.2 }, startColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, endColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } };
const minSeg: Segment = { start: { x: 0, y: 0, z: 0.3 }, end: { x: 0, y: 75, z: 0.3 }, startColor: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 }, endColor: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 } };
const secSeg: Segment = { start: { x: 0, y: 0, z: 0.4 }, end: { x: 0, y: 90, z: 0.4 }, startColor: { __type__: 'Color4', r: 1, g: 0.3, b: 0.3, a: 1 }, endColor: { __type__: 'Color4', r: 1, g: 0.3, b: 0.3, a: 1 } };

let hourRot: { x: number; y: number; z: number };
let minRot: { x: number; y: number; z: number };
let secRot: { x: number; y: number; z: number };

const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.15, g: 0.15, b: 0.15, a: 1 }, ambientColor: { __type__: 'Color4', r: 0.7, g: 0.7, b: 0.7, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 300 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 45, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 1000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'dirLight', position: { x: 0.5, y: 0.5, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] },
            // 表盘（扁平圆柱）
            { __type__: 'Object3D', name: 'dial', rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'CylinderGeometry', topRadius: 110, bottomRadius: 110, height: 10, segmentsW: 64 },
                material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.25, a: 1 }, u_specular: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 }, u_glossiness: 50, u_reflectivity: 0 } } }] },
            // 刻度
            { __type__: 'Object3D', name: 'ticks', components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SegmentGeometry', segments: tickSegments } as SegmentGeometry, material: { __type__: 'SegmentMaterial' } as SegmentMaterial }] },
            // 指针（各自旋转）
            { __type__: 'Object3D', name: 'hour', rotation: hourRot = { x: 0, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SegmentGeometry', segments: [hourSeg] } as SegmentGeometry, material: { __type__: 'SegmentMaterial' } as SegmentMaterial }] },
            { __type__: 'Object3D', name: 'minute', rotation: minRot = { x: 0, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SegmentGeometry', segments: [minSeg] } as SegmentGeometry, material: { __type__: 'SegmentMaterial' } as SegmentMaterial }] },
            { __type__: 'Object3D', name: 'second', rotation: secRot = { x: 0, y: 0, z: 0 }, components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SegmentGeometry', segments: [secSeg] } as SegmentGeometry, material: { __type__: 'SegmentMaterial' } as SegmentMaterial }] },
        ],
    },
};

const viewLogic = logic(view);
ticker.onframe(() =>
{
    const now = new Date();
    const h = (now.getHours() % 12) + now.getMinutes() / 60;
    const m = now.getMinutes() + now.getSeconds() / 60;
    const s = now.getSeconds() + now.getMilliseconds() / 1000;
    reactive(hourRot).z = -(h / 12) * Math.PI * 2;
    reactive(minRot).z = -(m / 60) * Math.PI * 2;
    reactive(secRot).z = -(s / 60) * Math.PI * 2;
    webgpu.submit(viewLogic.submit);
});
