import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, View, ticker } from 'feng3d';
import type { Segment, SegmentGeometry, SegmentMaterial } from 'feng3d';

/** DNA 双螺旋（两条相位差 π 的螺旋线 + 横档连接）。 */
const wc = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const segs: Segment[] = [];
const LEN = 200;
for (let i = 0; i < LEN; i++)
{
    const t = i / LEN;
    const a = t * Math.PI * 8;
    const x = (t - 0.5) * 200;
    const y1 = Math.sin(a) * 30; const z1 = Math.cos(a) * 30;
    const y2 = Math.sin(a + Math.PI) * 30; const z2 = Math.cos(a + Math.PI) * 30;
    if (i > 0)
    {
        const pt = (i - 1) / LEN;
        const pa = pt * Math.PI * 8;
        const px = (pt - 0.5) * 200;
        segs.push({ start: { x: px, y: Math.sin(pa) * 30, z: Math.cos(pa) * 30 }, end: { x, y: y1, z: z1 }, startColor: { __type__: 'Color4', r: 0.3, g: 0.5, b: 1, a: 1 }, endColor: { __type__: 'Color4', r: 0.3, g: 0.5, b: 1, a: 1 } });
        segs.push({ start: { x: px, y: Math.sin(pa + Math.PI) * 30, z: Math.cos(pa + Math.PI) * 30 }, end: { x, y: y2, z: z2 }, startColor: { __type__: 'Color4', r: 1, g: 0.5, b: 0.3, a: 1 }, endColor: { __type__: 'Color4', r: 1, g: 0.5, b: 0.3, a: 1 } });
    }
    if (i % 8 === 0) segs.push({ start: { x, y: y1, z: z1 }, end: { x, y: y2, z: z2 }, startColor: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 }, endColor: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 } });
}

let gr: { x: number; y: number; z: number };
const v: View = {
    __type__: 'View', canvas: wc,
    root: {
        __type__: 'Object3D', name: 'U',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.05, g: 0.05, b: 0.08, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 250 }, rotation: gr = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 45, aspect: wc.width / wc.height, near: 1, far: 1000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, autoRotate: true, autoRotateSpeed: 0.5 }] },
            { __type__: 'Object3D', name: 'dl', position: { x: 1, y: 1, z: 1 }, components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] },
            { __type__: 'Object3D', name: 'dna', components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'SegmentGeometry', segments: segs } as SegmentGeometry, material: { __type__: 'SegmentMaterial' } as SegmentMaterial }] },
        ],
    },
};
const vl = logic(v);
ticker.onframe(() => { reactive(gr).y += 0.005; webgpu.submit(vl.submit); });
