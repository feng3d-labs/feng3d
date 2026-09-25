import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, PointGeometry, PointMaterial, Ray3, reactive, Scene, View, ticker } from 'feng3d';
import type { Camera } from 'feng3d';

/** 射线拾取点云（鼠标附近的点高亮）。对照 three.js webgl_interactive_raycasting_points.html */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const COUNT = 3000;
const points: PointGeometry['points'] = [];
for (let i = 0; i < COUNT; i++)
{
    const theta = Math.acos(1 - 2 * (i + 0.5) / COUNT);
    const phi = Math.PI * (1 + Math.sqrt(5)) * i;
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);
    points.push({ position: { x: x * 150, y: y * 150, z: z * 150 }, color: { __type__: 'Color4', r: 0.5, g: 0.5, b: 1, a: 1 } });
}

let groupRot: { x: number; y: number; z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.05, g: 0.05, b: 0.05, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 400 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 45, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 2000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, enableRotate: false, enablePan: false }] },
            { __type__: 'Object3D', name: 'pts', rotation: groupRot = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PointGeometry', points } as PointGeometry,
                material: { __type__: 'PointMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, u_PointSize: 8 } } as PointMaterial }] },
        ],
    },
};
const viewLogic = logic(view);
const camera = view.root!.children![0].components![0] as unknown as Camera;
let hoverIdx = -1;

webgpuCanvas.addEventListener('pointermove', (e: PointerEvent) =>
{
    const rect = webgpuCanvas.getBoundingClientRect();
    const ray = logic(camera).getRay3D?.((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height) as Ray3 | undefined;
    if (!ray) return;
    // 射线最近距离拾取
    let bestIdx = -1, bestDist = 400;
    for (let i = 0; i < points.length; i++)
    {
        const p = points[i].position as { x: number; y: number; z: number };
        const t = (p.x - ray.origin.x) * ray.direction.x + (p.y - ray.origin.y) * ray.direction.y + (p.z - ray.origin.z) * ray.direction.z;
        if (t < 0 || t > 2000) continue;
        const px = ray.origin.x + ray.direction.x * t, py = ray.origin.y + ray.direction.y * t, pz = ray.origin.z + ray.direction.z * t;
        const d = (p.x - px) ** 2 + (p.y - py) ** 2 + (p.z - pz) ** 2;
        if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    if (bestIdx !== hoverIdx)
    {
        if (hoverIdx >= 0) reactive(points[hoverIdx]).color = { __type__: 'Color4', r: 0.5, g: 0.5, b: 1, a: 1 };
        if (bestIdx >= 0) reactive(points[bestIdx]).color = { __type__: 'Color4', r: 1, g: 1, b: 0, a: 1 };
        hoverIdx = bestIdx;
    }
});

ticker.onframe(() => { reactive(groupRot).y += 0.002; webgpu.submit(viewLogic.submit); });
