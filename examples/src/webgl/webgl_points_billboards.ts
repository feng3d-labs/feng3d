import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromCanvas, logic, Object3D, PointGeometry, PointMaterial, reactive, Scene, View, ticker } from 'feng3d';

/** 粒子公告板（圆形纹理 + 颜色渐变）。对照 three.js webgl_points_billboards.html */
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 程序化圆形粒子纹理
const tc = document.createElement('canvas'); tc.width = tc.height = 64;
const tctx = tc.getContext('2d')!;
const g = tctx.createRadialGradient(32, 32, 0, 32, 32, 32);
g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
tctx.fillStyle = g; tctx.fillRect(0, 0, 64, 64);

const COUNT = 5000;
const points: PointGeometry['points'] = [];
for (let i = 0; i < COUNT; i++)
{
    const r = Math.random() * 800 + 200;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    points.push({
        position: { x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi) },
        color: { __type__: 'Color4', r: Math.random(), g: Math.random(), b: Math.random(), a: 0.6 },
    });
}

let groupRot: { x: number; y: number; z: number };
const view: View = {
    __type__: 'View', canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D', name: 'Untitled',
        components: [{ __type__: 'Scene', background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 } }],
        children: [
            { __type__: 'Object3D', name: 'cam', position: { x: 0, y: 0, z: 2000 }, rotation: { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'PerspectiveCamera', fov: 55, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 2, far: 2000 }, { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, autoRotate: true, autoRotateSpeed: 0.3 }] },
            { __type__: 'Object3D', name: 'pts', rotation: groupRot = { x: 0, y: 0, z: 0 },
              components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PointGeometry', points } as PointGeometry,
                material: { __type__: 'PointMaterial', uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }, u_PointSize: 10 } } as PointMaterial }] },
        ],
    },
};
const viewLogic = logic(view);
ticker.onframe(() => { reactive(groupRot).y += 0.001; webgpu.submit(viewLogic.submit); });
