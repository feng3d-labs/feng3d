import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, PointGeometry, PointMaterial, reactive, Scene, View, ticker } from 'feng3d';

/** 精灵粒子（星形分布 + 颜色渐变 + 闪烁动画）。对照 three.js webgl_points_sprites.html */
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const COUNT = 5000;
const points: PointGeometry['points'] = [];
const baseY: number[] = [];
for (let i = 0; i < COUNT; i++)
{
    const x = (Math.random() - 0.5) * 800;
    const y = (Math.random() - 0.5) * 800;
    const z = (Math.random() - 0.5) * 800;
    baseY.push(y);
    points.push({
        position: { x, y, z },
        color: { __type__: 'Color4', r: Math.abs(x) / 400, g: Math.abs(y) / 400, b: Math.abs(z) / 400, a: 0.7 },
    });
}

const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0.01, g: 0.01, b: 0.02, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 1000 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 55, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 3000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, autoRotate: true, autoRotateSpeed: 0.3 }] },
            { __type__: 'Object3D', name: 'pts', rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PointGeometry', points } as PointGeometry,
                material: { __type__: 'PointMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, u_PointSize: 8 } } as PointMaterial }] },
        ],
    },
};
const viewLogic = logic(view);
const startTime = Date.now();
ticker.onframe(() =>
{
    const t = (Date.now() - startTime) * 0.001;
    // 闪烁：每 100 个粒子批量更新 alpha
    for (let i = 0; i < points.length; i += 50)
    {
        const alpha = 0.3 + Math.sin(t * 3 + i * 0.01) * 0.4;
        reactive(points[i]).color = { __type__: 'Color4', r: points[i].color.r, g: points[i].color.g, b: points[i].color.b, a: Math.max(0.1, alpha) };
    }
    webgpu.submit(viewLogic.submit);
});
