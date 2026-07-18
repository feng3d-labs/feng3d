import { Object3D, reactive, Texture2D, View, ticker, logic, Scene } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';

const sceneObject3D: Object3D = {
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
            __type__: 'Camera',
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
                material: { __type__: 'StandardMaterial' },
            }, {
                __type__: 'HoldSizeComponent',
                holdSize: 1,
            }, {
                __type__: 'BillboardComponent',
            }],
        }],
    }],
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
logic(sceneObject3D);
const scene = sceneObject3D.components!.find(c => c.__type__ === 'Scene') as Scene;
const view: View = { __type__: 'View', canvas: webgpuCanvas, scene };
const viewLogic = logic(view);

// camera 引用与纹理需在 View 创建后赋值（引用场景内对象，无法纯字面量声明）
const camera = sceneObject3D.children![0].components![0] as any;
const billboard = (sceneObject3D.children![1].children![0]);
const billboardModel = billboard.components!.find(c => c.__type__ === 'MeshRenderer') as any;
const holdSizeComponent = billboard.components!.find(c => c.__type__ === 'HoldSizeComponent') as any;
const billboardComponent = billboard.components!.find(c => c.__type__ === 'BillboardComponent') as any;

reactive(holdSizeComponent).camera = camera;
reactive(billboardComponent).camera = camera;

// 材质纹理
const diffuseTex = new Texture2D();
diffuseTex.source = { url: '/m.png' };
reactive(billboardModel.material).s_diffuse = diffuseTex;

ticker.onframe(() => webgpu.submit(viewLogic.render()));
