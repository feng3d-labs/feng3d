import { Object3D, reactive, ticker, View, Texture2D, FogMode, logic, Scene } from 'feng3d';
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
        name: 'Cube',
        position: { x: 0, y: 0, z: -7 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry' },
            material: {
                __type__: 'StandardMaterial',
                uniforms: {
                    u_fogMode: FogMode.LINEAR,
                    u_fogColor: { __type__: 'Color4', r: 1, g: 1, b: 0, a: 1 },
                    u_fogMinDistance: 2,
                    u_fogMaxDistance: 3,
                },
                s_diffuse: (() => { const t = new Texture2D(); t.source = { url: '/m.png' }; return t; })(),
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

ticker.onframe(() =>
{
    const cube = sceneObject3D.children!.find(c => c.name === 'Cube')!;
    reactive(cube.rotation).y += 1;
});

ticker.onframe(() => webgpu.submit(viewLogic.render()));
