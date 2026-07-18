import { Object3D, View, logic, Vector3, ticker } from 'feng3d';
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
        name: 'cube',
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry' },
            material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: { __type__: 'Color4' } } },
        }],
    }, {
        __type__: 'Object3D',
        name: 'sphere',
        position: { x: -1.5, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'SphereGeometry' },
            material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: { __type__: 'Color4' } } },
        }],
    }, {
        __type__: 'Object3D',
        name: 'capsule',
        position: { x: 3, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CapsuleGeometry' },
            material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: { __type__: 'Color4' } } },
        }],
    }, {
        __type__: 'Object3D',
        name: 'cylinder',
        position: { x: -3, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CylinderGeometry' },
            material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: { __type__: 'Color4' } } },
        }],
    }],
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const engine = new View(webgpuCanvas, sceneObject3D);

const camera = sceneObject3D.children!.find(c => c.name === 'Main Camera')!;
logic(camera).lookAt(new Vector3(0, 0, 0));

ticker.onframe(() => webgpu.submit(engine.render()));
