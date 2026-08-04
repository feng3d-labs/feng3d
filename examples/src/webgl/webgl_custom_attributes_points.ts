import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, PointGeometry, PointMaterial, reactive, Scene, View, ticker } from 'feng3d';

/**
 * 彩色粒子流（自定义属性简化版）。
 *
 * 对照 three.js：examples/webgl_custom_attributes_points.html
 * 原示例用 ShaderMaterial 每点独立 size + spark 纹理。feng3d PointMaterial 统一 size，
 * 保留每点独立颜色 + 正弦 size 脉动（材质级 u_PointSize 动画近似）。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const PARTICLES = 8000;
const points: PointGeometry['points'] = [];

for (let i = 0; i < PARTICLES; i++)
{
    const theta = Math.acos(1 - 2 * (i + 0.5) / PARTICLES);
    const phi = Math.PI * (1 + Math.sqrt(5)) * i;
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);
    points.push({
        position: { x: x * 150, y: y * 150, z: z * 150 },
        color: {
            __type__: 'Color4',
            r: (x + 1) * 0.5,
            g: (y + 1) * 0.5,
            b: (z + 1) * 0.5,
            a: 0.8,
        },
    });
}

let groupRot: { x: number; y: number; z: number };
let groupScale: { x: number; y: number; z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.02, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 500 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'PerspectiveCamera', fov: 50,
                    aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 3000,
                },
                { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, autoRotate: true, autoRotateSpeed: 0.3 }],
            },
            {
                __type__: 'Object3D', name: 'particles',
                rotation: groupRot = { x: 0, y: 0, z: 0 },
                scale: groupScale = { x: 1, y: 1, z: 1 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'PointGeometry', points } as PointGeometry,
                    material: {
                        __type__: 'PointMaterial',
                        uniforms: {
                            u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                            u_PointSize: 6,
                        },
                    } as PointMaterial,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
const particleNode = view.root!.children![1];
const particleMat = (particleNode.components![0] as { material: { uniforms: { u_PointSize: number } } }).material;

ticker.onframe(() =>
{
    reactive(groupRot).y += 0.001;
    // 正弦脉动（近似原示例的 per-point size 变化）
    const t = Date.now() * 0.002;
    reactive(particleMat.uniforms).u_PointSize = 4 + Math.sin(t) * 3;
    webgpu.submit(viewLogic.submit);
});
