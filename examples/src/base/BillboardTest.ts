import { WebGPU } from '@feng3d/webgpu';
import { Billboard, HoldSize, logic, reactive, StandardMaterial, createTextureFromUrl, ticker, View } from 'feng3d';

let material: StandardMaterial;
let holdSizeComponent: HoldSize;
let billboardComponent: Billboard;

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
            background: { __type__: 'Color4', r: 0.3, g: 0.3, b: 0.3, a: 1 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 1, z: -10 },
            components: [{
                __type__: 'PerspectiveCamera',
            }, {
                __type__: 'FPSController',
            }],
        }, {
            __type__: 'Object3D',
            name: 'Cube',
            position: { x: 0, y: 0, z: 3 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
            }],
            children: [{
                __type__: 'Object3D',
                name: 'Billboard',
                position: { x: 0, y: 1.5, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'PlaneGeometry', width: 0.1, height: 0.1, segmentsW: 1, segmentsH: 1, yUp: false },
                    material: material = { __type__: 'StandardMaterial' },
                }, holdSizeComponent = {
                    __type__: 'HoldSize',
                    holdSize: 1,
                }, billboardComponent = {
                    __type__: 'Billboard',
                }],
            }],
        }],
    }
};

const viewLogic = logic(view);

// 材质纹理（createTextureFromUrl 返回 Promise<Texture>，await 后赋值）
const diffuseTex = await createTextureFromUrl('/m.png');
reactive(material).s_diffuse = diffuseTex;

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
