import { reactive, View, ticker, logic } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';

let segmentRotation: { readonly x: number; readonly y: number; readonly z: number; };

// 生成正弦曲线段集
const length = 200;
const height = 2 / Math.PI;
const segments: { start: { x: number; y: number; z: number }; end: { x: number; y: number; z: number }; startColor: { __type__: 'Color4'; r: number; g: number; b: number; a: number }; endColor: { __type__: 'Color4'; r: number; g: number; b: number; a: number } }[] = [];
let preX = -length / 100;
let preY = Math.sin(-Math.PI) * height;
for (let x = -length + 1; x <= length; x++)
{
    const angle = x / length * Math.PI;
    const curX = x / 100;
    const curY = Math.sin(angle) * height;
    segments.push({
        start: { x: preX, y: preY, z: 0 },
        end: { x: curX, y: curY, z: 0 },
        startColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        endColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
    });
    preX = curX;
    preY = curY;
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
            name: 'segment',
            position: { x: 0, y: 0, z: 3 },
            rotation: segmentRotation = { x: 0, y: 0, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'SegmentGeometry', segments } as any,
                material: { __type__: 'SegmentMaterial' },
            }],
        }],
    },
};
const viewLogic = logic(view);

// 变化旋转（rotation 单位为弧度，1° = π/180）
setInterval(() =>
{
    reactive(segmentRotation).y += Math.PI / 180;
}, 15);

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
