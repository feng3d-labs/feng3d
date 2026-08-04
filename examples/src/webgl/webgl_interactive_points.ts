import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, PointGeometry, PointMaterial, raycaster, Ray3, reactive, Scene, View, ticker } from 'feng3d';
import type { Camera } from 'feng3d';

/**
 * 拾取粒子点（悬停高亮）。
 *
 * 对照 three.js：examples/webgl_interactive_points.html
 * 鼠标悬停的粒子点高亮变色。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const POINTS = 2000;
const points: PointGeometry['points'] = [];
for (let i = 0; i < POINTS; i++)
{
    const theta = Math.acos(1 - 2 * (i + 0.5) / POINTS);
    const phi = Math.PI * (1 + Math.sqrt(5)) * i;
    points.push({
        position: { x: Math.sin(theta) * Math.cos(phi) * 100, y: Math.sin(theta) * Math.sin(phi) * 100, z: Math.cos(theta) * 100 },
        color: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 },
    });
}

let groupRot: { x: number; y: number; z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.05, g: 0.05, b: 0.05, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 300 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 45, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 1000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, enableRotate: false, enablePan: false }] },
            { __type__: 'Object3D', name: 'points', rotation: groupRot = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PointGeometry', points } as PointGeometry,
                material: { __type__: 'PointMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, u_PointSize: 8 } } as PointMaterial }] },
        ],
    },
};

const viewLogic = logic(view);
const camera = view.root!.children![0].components![0] as unknown as Camera;
const pointsNode = view.root!.children![1];
let lastHitIdx = -1;

webgpuCanvas.addEventListener('pointermove', (e: PointerEvent) =>
{
    const rect = webgpuCanvas.getBoundingClientRect();
    const ray = logic(camera).getRay3D?.((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height) as Ray3 | undefined;
    if (!ray) return;
    // 用包围盒近似拾取：找最近的点
    const nodePos = logic(pointsNode);
    const ox = ray.origin.x, oy = ray.origin.y, oz = ray.origin.z;
    const dx = ray.direction.x, dy = ray.direction.y, dz = ray.direction.z;
    let bestIdx = -1, bestDist = 15; // 阈值
    for (let i = 0; i < points.length; i++)
    {
        const p = points[i].position as { x: number; y: number; z: number };
        // 点到射线的距离
        const px = p.x - ox, py = p.y - oy, pz = p.z - oz;
        const t = px * dx + py * dy + pz * dz;
        if (t < 0 || t > 500) continue;
        const projX = ox + dx * t, projY = oy + dy * t, projZ = oz + dz * t;
        const distSq = (p.x - projX) ** 2 + (p.y - projY) ** 2 + (p.z - projZ) ** 2;
        if (distSq < bestDist) { bestDist = distSq; bestIdx = i; }
    }
    if (bestIdx !== lastHitIdx)
    {
        if (lastHitIdx >= 0) reactive(points[lastHitIdx]).color = { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 };
        if (bestIdx >= 0) reactive(points[bestIdx]).color = { __type__: 'Color4', r: 1, g: 0.5, b: 0, a: 1 };
        lastHitIdx = bestIdx;
    }
});

ticker.onframe(() => { reactive(groupRot).y += 0.002; webgpu.submit(viewLogic.submit); });
