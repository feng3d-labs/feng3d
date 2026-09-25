import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, raycaster, Ray3, reactive, Scene, Segment, SegmentGeometry, SegmentMaterial, StandardMaterial, View, ticker } from 'feng3d';
import type { Camera } from 'feng3d';

/** 线段拾取（悬停高亮）。对照 three.js webgl_interactive_lines.html */
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 球面线框
const segments: Segment[] = [];
const LAT = 10, LNG = 20, R = 100;
for (let i = 0; i < LAT; i++)
{
    const lat1 = (i / LAT) * Math.PI, lat2 = ((i + 1) / LAT) * Math.PI;
    for (let j = 0; j < LNG; j++)
    {
        const lng1 = (j / LNG) * Math.PI * 2, lng2 = ((j + 1) / LNG) * Math.PI * 2;
        // 经线段
        segments.push({
            start: { x: R * Math.sin(lat1) * Math.cos(lng1), y: R * Math.cos(lat1), z: R * Math.sin(lat1) * Math.sin(lng1) },
            end: { x: R * Math.sin(lat2) * Math.cos(lng1), y: R * Math.cos(lat2), z: R * Math.sin(lat2) * Math.sin(lng1) },
            startColor: { __type__: 'Color4', r: 0.5, g: 0.5, b: 1, a: 1 }, endColor: { __type__: 'Color4', r: 0.5, g: 0.5, b: 1, a: 1 },
        });
    }
}

const geo: SegmentGeometry = { __type__: 'SegmentGeometry', segments } as SegmentGeometry;
const mat: SegmentMaterial = { __type__: 'SegmentMaterial' } as SegmentMaterial;
let groupRot: { x: number; y: number; z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.94, g: 0.94, b: 0.94, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 300 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 70, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 10000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, enableRotate: false, enablePan: false }] },
            { __type__: 'Object3D', name: 'linesphere', rotation: groupRot = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: geo, material: mat }] },
        ],
    },
};
const viewLogic = logic(view);
const camera = view.root!.children![0].components![0] as unknown as Camera;
const lineNode = view.root!.children![1];
let lastIdx = -1;

webgpuCanvas.addEventListener('pointermove', (e: PointerEvent) =>
{
    const rect = webgpuCanvas.getBoundingClientRect();
    const ray = logic(camera).getRay3D?.((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height) as Ray3 | undefined;
    if (!ray) return;
    // 射线与线段的最近距离拾取
    const hit = raycaster.pick(ray, [lineNode]);
    if (hit)
    {
        const idx = (hit as { index?: number }).index ?? -1;
        if (idx !== lastIdx && lastIdx >= 0)
        {
            reactive(segments[lastIdx]).startColor = { __type__: 'Color4', r: 0.5, g: 0.5, b: 1, a: 1 };
            reactive(segments[lastIdx]).endColor = { __type__: 'Color4', r: 0.5, g: 0.5, b: 1, a: 1 };
        }
        if (idx >= 0)
        {
            reactive(segments[idx]).startColor = { __type__: 'Color4', r: 1, g: 0.5, b: 0, a: 1 };
            reactive(segments[idx]).endColor = { __type__: 'Color4', r: 1, g: 0.5, b: 0, a: 1 };
        }
        lastIdx = idx;
    }
    else if (lastIdx >= 0)
    {
        reactive(segments[lastIdx]).startColor = { __type__: 'Color4', r: 0.5, g: 0.5, b: 1, a: 1 };
        reactive(segments[lastIdx]).endColor = { __type__: 'Color4', r: 0.5, g: 0.5, b: 1, a: 1 };
        lastIdx = -1;
    }
});

ticker.onframe(() => { reactive(groupRot).y += 0.003; webgpu.submit(viewLogic.submit); });
