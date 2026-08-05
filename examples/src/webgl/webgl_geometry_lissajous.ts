import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, View, ticker } from 'feng3d';
import type { Segment, SegmentGeometry, SegmentMaterial } from 'feng3d';

/** 3D 利萨如曲线（参数方程彩色线段）。 */
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const segs: Segment[] = [];
const N = 500;
for (let i = 0; i < N - 1; i++)
{
    const t = i / (N - 1);
    const t2 = (i + 1) / (N - 1);
    const r = Math.sin(t * 6.28) * 0.5 + 0.5;
    const g = Math.sin(t * 6.28 + 2.1) * 0.5 + 0.5;
    const b = Math.sin(t * 6.28 + 4.2) * 0.5 + 0.5;
    segs.push({
        start: { x: Math.sin(3 * t * Math.PI) * 60, y: Math.sin(5 * t * Math.PI) * 60, z: Math.sin(7 * t * Math.PI) * 30 },
        end: { x: Math.sin(3 * t2 * Math.PI) * 60, y: Math.sin(5 * t2 * Math.PI) * 60, z: Math.sin(7 * t2 * Math.PI) * 30 },
        startColor: { __type__: 'Color4', r, g, b, a: 1 }, endColor: { __type__: 'Color4', r, g, b, a: 1 },
    });
}

let gr: { x: number; y: number; z: number };
const v: View = {
    __type__: 'View', canvas: wc,
    root: {
        __type__: 'Object3D', name: 'U',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.03, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 180 }, rotation: gr = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 50, aspect: wc.width / wc.height, near: 1, far: 1000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, autoRotate: true, autoRotateSpeed: 0.5 }] },
            { __type__: 'Object3D', name: 'dl', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] },
            { __type__: 'Object3D', name: 'curve', components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SegmentGeometry', segments: segs } as SegmentGeometry, material: { __type__: 'SegmentMaterial' } as SegmentMaterial }] },
        ],
    },
};
const vl = logic(v);
ticker.onframe(() => { reactive(gr).y += 0.003; webgpu.submit(vl.submit); });
