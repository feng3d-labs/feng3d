import { reactive, createTextureFromUrl, View, ticker, logic } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';

let cubeRotation: { readonly x: number; readonly y: number; readonly z: number; };

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 先 await 纹理 Promise，再构造 View
const m_texture = await createTextureFromUrl('/m.png');

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
            position: { x: 0, y: 1, z: -10 },
            components: [{
                __type__: 'PerspectiveCamera',
            }],
        }, {
            __type__: 'Object3D',
            name: 'cube',
            position: { x: 0, y: 0, z: 0 },
            rotation: cubeRotation = { x: 0, y: 0, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: {
                    __type__: 'StandardMaterial',
                    uniforms: {
                        u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                    },
                    s_diffuse: m_texture,
                },
            }],
        }],
    },
};
const viewLogic = logic(view);

setInterval(() =>
{
    reactive(cubeRotation).y += 1;
}, 15);

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
