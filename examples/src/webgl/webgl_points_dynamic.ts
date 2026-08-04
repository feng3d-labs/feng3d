import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromCanvas, logic, Object3D, PointGeometry, PointMaterial, reactive, Scene, View, ticker } from 'feng3d';

/** 动态粒子流（螺旋扩散动画）。对照 three.js webgl_points_dynamic.html */
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const COUNT = 3000;
const points: PointGeometry['points'] = [];
const phases: number[] = [];
for (let i = 0; i < COUNT; i++)
{
    phases.push(Math.random() * Math.PI * 2);
    points.push({ position: { x: 0, y: 0, z: 0 }, color: { __type__: 'Color4', r: 1, g: 0.5, b: 0.2, a: 0.8 } });
}

let groupRot: { x: number; y: number; z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.02, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 500 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 60, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 3000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, autoRotate: true, autoRotateSpeed: 0.5 }] },
            { __type__: 'Object3D', name: 'pts', rotation: groupRot = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PointGeometry', points } as PointGeometry,
                material: { __type__: 'PointMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, u_PointSize: 6 } } as PointMaterial }] },
        ],
    },
};
const viewLogic = logic(view);
ticker.onframe(() =>
{
    const t = Date.now() * 0.001;
    for (let i = 0; i < COUNT; i++)
    {
        const ph = phases[i];
        const spiral = (i / COUNT) * Math.PI * 20 + t;
        const r = 50 + Math.sin(t * 2 + ph) * 150;
        reactive(points[i]).position = {
            x: r * Math.cos(spiral),
            y: (Math.sin(ph + t * 1.5)) * 200,
            z: r * Math.sin(spiral),
        };
    }
    reactive(groupRot).y += 0.001;
    webgpu.submit(viewLogic.submit);
});
