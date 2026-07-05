import { Camera, Color4, ColorUniforms, CubeGeometry, CylinderGeometry, MeshRenderer, Object3D, reactive, Scene, StandardMaterial, ColorMaterial, ticker, View } from 'feng3d';

const scene: Scene = {
    __type__: 'Scene',
    background: new Color4(0.408, 0.38, 0.357, 1.0),
};
const camera: Camera = {
    __type__: 'Camera',
};
let cubeRotation: { readonly x: number; readonly y: number; readonly z: number; };
let uniforms: ColorUniforms;
const cubeMesh: MeshRenderer = {
    __type__: 'MeshRenderer',
    geometry: { __type__: 'CubeGeometry' } as CubeGeometry,
    material: {
        __type__: 'ColorMaterial',
        uniforms: uniforms = { u_diffuseInput: new Color4() },
    } as ColorMaterial,
};
const cylinderMesh: MeshRenderer = {
    __type__: 'MeshRenderer',
    geometry: { __type__: 'CylinderGeometry' } as CylinderGeometry,
    material: { __type__: 'StandardMaterial' } as StandardMaterial,
};

const sceneObject3D: Object3D = {
    __class__: 'Entity',
    __type__: 'Object3D',
    name: 'Untitled',
    components: [scene],
    children: [{
        __class__: 'Entity',
        __type__: 'Object3D',
        name: 'Main Camera',
        position: { x: 0, y: 1, z: -10 },
        components: [camera],
    }, {
        __class__: 'Entity',
        __type__: 'Object3D',
        name: 'Cube',
        rotation: cubeRotation = { x: 0, y: 0, z: 0 },
        components: [cubeMesh],
        children: [{
            __class__: 'Entity',
            __type__: 'Object3D',
            name: 'Cylinder',
            position: { x: 2, y: 0, z: 0 },
            components: [cylinderMesh],
        }],
    }],
};

const engine = new View(null, sceneObject3D);

let num = 0;
ticker.onframe(() =>
{
    // 变化旋转与颜色
    reactive(cubeRotation).y += 1;

    num++;

    if (num % 60 == 0)
    {
        reactive(uniforms).u_diffuseInput = new Color4().fromUnit(Math.random() * (1 << 32 - 1));
    }
});
