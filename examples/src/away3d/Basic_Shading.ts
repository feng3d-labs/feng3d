import { Object3D, reactive, ticker, Texture2D, View, logic, Vector3 } from 'feng3d';

function tex(url: string) { const t = new Texture2D(); t.source = { url }; return t; }

const sceneObject3D: Object3D = {
    __type__: 'Object3D',
    name: 'Untitled',
    components: [{
        __type__: 'Scene',
        background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
        ambientColor: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.2, a: 0.2 },
    }],
    children: [{
        __type__: 'Object3D',
        name: 'Main Camera',
        position: { x: 0, y: 5, z: -10 },
        components: [{
            __type__: 'Camera',
        }, {
            __type__: 'FPSController',
        }],
    }, {
        __type__: 'Object3D',
        name: 'light1',
        rotation: { x: 30, y: 0, z: 0 },
        components: [{
            __type__: 'DirectionalLight',
            intensity: 0.7,
            color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
        }],
    }, {
        __type__: 'Object3D',
        name: 'light2',
        rotation: { x: 90, y: 0, z: 0 },
        components: [{
            __type__: 'DirectionalLight',
            intensity: 0.7,
            color: { __type__: 'Color3', r: 0, g: 1, b: 1 },
        }],
    }, {
        __type__: 'Object3D',
        name: 'plane',
        position: { x: 0, y: -0.2, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'PlaneGeometry', width: 10, height: 10, segmentsW: 1, segmentsH: 1, yUp: false, scaleU: 2, scaleV: 2 },
            material: {
                __type__: 'StandardMaterial',
                s_diffuse: tex('/floor_diffuse.jpg'),
                s_normal: tex('/floor_normal.jpg'),
                s_specular: tex('/floor_specular.jpg'),
            },
        }],
    }, {
        __type__: 'Object3D',
        name: 'sphere',
        position: { x: 3, y: 1.6, z: 3 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'SphereGeometry', radius: 1.5, segmentsW: 40, segmentsH: 20 },
            material: {
                __type__: 'StandardMaterial',
                s_diffuse: tex('/beachball_diffuse.jpg'),
                s_specular: tex('/beachball_specular.jpg'),
            },
        }],
    }, {
        __type__: 'Object3D',
        name: 'cube',
        position: { x: 3, y: 1.6, z: -2.5 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry', width: 2, height: 2, depth: 2 },
            material: {
                __type__: 'StandardMaterial',
                s_diffuse: tex('/trinket_diffuse.jpg'),
                s_normal: tex('/trinket_normal.jpg'),
                s_specular: tex('/trinket_specular.jpg'),
            },
        }],
    }, {
        __type__: 'Object3D',
        name: 'torus',
        position: { x: -2.5, y: 1.6, z: -2.5 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'TorusGeometry', radius: 1.5, tubeRadius: 0.6, segmentsR: 40, segmentsT: 20, scaleU: 10, scaleV: 5 },
            material: {
                __type__: 'StandardMaterial',
                s_diffuse: tex('/weave_diffuse.jpg'),
                s_normal: tex('/weave_normal.jpg'),
                s_specular: tex('/weave_diffuse.jpg'),
            },
        }],
    }],
};

const engine = new View(null, sceneObject3D);

// 相机看向原点
const camera = sceneObject3D.children!.find(c => c.name === 'Main Camera')!;
logic(camera).lookAt(new Vector3(0, 0, 0));

// 光源旋转
const light1 = sceneObject3D.children!.find(c => c.name === 'light1')!;
ticker.onframe(() =>
{
    reactive(light1.rotation).y += 1;
});
