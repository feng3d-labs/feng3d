import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, PointGeometry, PointMaterial, reactive, Scene, View, ticker } from 'feng3d';

/** 波浪粒子（正弦波网格动画）。对照 three.js webgl_points_waves.html */
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const SEGS = 80;
const SPACING = 50;
const points: PointGeometry['points'] = [];
const basePos: { x: number; z: number }[] = [];
for (let z = 0; z < SEGS; z++)
    for (let x = 0; x < SEGS; x++)
    {
        const px = (x - SEGS / 2) * SPACING;
        const pz = (z - SEGS / 2) * SPACING;
        basePos.push({ x: px, z: pz });
        points.push({ position: { x: px, y: 0, z: pz }, color: { __type__: 'Color4', r: 0.3, g: 0.7, b: 1, a: 1 } });
    }

let groupRot: { x: number; y: number; z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 2000, z: 2500 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 75, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 10000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }] },
            { __type__: 'Object3D', name: 'waves', rotation: groupRot = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PointGeometry', points } as PointGeometry,
                material: { __type__: 'PointMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, u_PointSize: 8 } } as PointMaterial }] },
        ],
    },
};
const viewLogic = logic(view);
ticker.onframe(() =>
{
    const t = Date.now() * 0.001;
    for (let i = 0; i < points.length; i++)
    {
        const bp = basePos[i];
        const dist = Math.sqrt(bp.x * bp.x + bp.z * bp.z);
        const y = Math.sin(dist * 0.01 - t * 2) * 200;
        reactive(points[i]).position = { x: bp.x, y, z: bp.z };
    }
    webgpu.submit(viewLogic.submit);
});
