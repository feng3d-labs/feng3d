import { Camera, Color4, ColorUniforms, MeshRenderer, Object3D, reactive, Scene, StandardMaterial, ticker, View } from 'feng3d';

let camera: Camera;
let cubeRotation: { readonly x: number; readonly y: number; readonly z: number; };
let uniforms: ColorUniforms;
let scene: Scene;

const sceneObject3D: Object3D = {
    __type__: 'Object3D',
    name: 'Untitled',
    components: [scene = {
        __type__: 'Scene',
        background: new Color4(0.408, 0.38, 0.357, 1.0),
    } as Scene],
    children: [{
        __type__: 'Object3D',
        name: 'Main Camera',
        position: { x: 0, y: 1, z: -10 },
        components: [camera = {
            __type__: 'Camera',
        } as Camera],
    } as Object3D, {
        __type__: 'Object3D',
        name: 'Cube',
        rotation: cubeRotation = { x: 0, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: {
                __type__: 'CubeGeometry',
            },
            material: {
                __type__: 'ColorMaterial',
                uniforms: uniforms = { u_diffuseInput: new Color4() },
            },
        } as unknown as MeshRenderer],
        children: [{
            __type__: 'Object3D',
            name: 'Cylinder',
            position: { x: 2, y: 0, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: {
                    __type__: 'CylinderGeometry',
                },
                material: {
                    __type__: 'StandardMaterial',
                } as StandardMaterial,
            } as unknown as MeshRenderer],
        } as Object3D],
    } as Object3D],
} as Object3D;

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
