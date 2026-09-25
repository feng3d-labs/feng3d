import { reactive, View, ticker, logic } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';

let planeRotation: { readonly x: number; readonly y: number; readonly z: number; };

// 生成正弦曲线点集
const length = 200;
const height = 2 / Math.PI;
const points: { position: { x: number; y: number; z: number } }[] = [];
for (let x = -length; x <= length; x += 4)
{
    const angle = x / length * Math.PI;
    points.push({ position: { x: x / 100, y: Math.sin(angle) * height, z: 0 } });
}

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 1, z: 10 },
            components: [{
                __type__: 'PerspectiveCamera',
            }],
        }, {
            __type__: 'Object3D',
            name: 'plane',
            position: { x: 0, y: 0, z: 3 },
            rotation: planeRotation = { x: 0, y: 0, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'PointGeometry', points } as any,
                material: { __type__: 'PointMaterial' },
            }],
        }],
    },
};
const viewLogic = logic(view);

// 变化旋转（rotation 单位为弧度，1° = π/180）
setInterval(() =>
{
    reactive(planeRotation).y += Math.PI / 180;
}, 15);

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
