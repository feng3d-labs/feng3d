import { Object3D, View, ticker, logic, Scene } from 'feng3d';
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
        position: { x: 0, y: 1, z: -5 },
        components: [{
            __type__: 'Camera',
        }, {
            __type__: 'FPSController',
        }],
    }, {
        __type__: 'Object3D',
        name: 'Cube',
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry' },
        }],
    }, {
        __type__: 'Object3D',
        name: 'Sphere',
        position: { x: -1.5, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'SphereGeometry' },
        }],
    }, {
        __type__: 'Object3D',
        name: 'Plane',
        position: { x: 1.5, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'PlaneGeometry' },
        }],
    }, {
        __type__: 'Object3D',
        name: 'Capsule',
        position: { x: 3, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CapsuleGeometry' },
        }],
    }, {
        __type__: 'Object3D',
        name: 'Cylinder',
        position: { x: -3, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CylinderGeometry' },
        }],
    }],
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const view: View = { __type__: 'View', canvas: webgpuCanvas, root: sceneObject3D };
const viewLogic = logic(view);

ticker.onframe(() => webgpu.submit(viewLogic.render()));
