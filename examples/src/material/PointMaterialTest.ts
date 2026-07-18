import { Object3D, reactive, Vector3, View, ticker, logic, Scene } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';

// 生成正弦曲线点集
const length = 200;
const height = 2 / Math.PI;
const points: { position: { x: number; y: number; z: number } }[] = [];
for (let x = -length; x <= length; x += 4)
{
    const angle = x / length * Math.PI;
    points.push({ position: { x: x / 100, y: Math.sin(angle) * height, z: 0 } });
}

const sceneObject3D: Object3D = {
    __type__: 'Object3D',
    name: 'Untitled',
    components: [{
        __type__: 'Scene',
        background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
    }],
    children: [{
        __type__: 'Object3D',
        name: 'Main Camera',
        position: { x: 0, y: 1, z: -10 },
        components: [{
            __type__: 'Camera',
        }],
    }, {
        __type__: 'Object3D',
        name: 'plane',
        position: { x: 0, y: 0, z: 3 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'PointGeometry', points } as any,
            material: { __type__: 'PointMaterial' },
        }],
    }],
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const view: View = { __type__: 'View', canvas: webgpuCanvas, root: sceneObject3D };
const viewLogic = logic(view);

// 变化旋转
setInterval(() =>
{
    const plane = sceneObject3D.children!.find(c => c.name === 'plane')!;
    reactive(plane.rotation).y += 1;
}, 15);

ticker.onframe(() => webgpu.submit(viewLogic.render()));
