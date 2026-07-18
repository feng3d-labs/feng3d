import { Object3D, reactive, Texture2D, View, ticker, logic } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';

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
        name: 'cube',
        position: { x: 0, y: -1, z: 3 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry' },
            material: {
                __type__: 'TextureMaterial',
                s_texture: (() => { const t = new Texture2D(); t.source = { url: '/m.png' }; return t; })(),
            },
        }],
    }],
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
logic(sceneObject3D);
const scene = sceneObject3D.components!.find(c => c.__type__ === 'Scene') as Scene;
const view: View = { __type__: 'View', canvas: webgpuCanvas, scene };
const viewLogic = logic(view);

setInterval(() =>
{
    const cube = sceneObject3D.children!.find(c => c.name === 'cube')!;
    reactive(cube.rotation).y += 1;
}, 15);

ticker.onframe(() => webgpu.submit(viewLogic.render()));
