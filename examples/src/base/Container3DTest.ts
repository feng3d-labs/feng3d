import { Camera, Color4, ColorUniforms, Geometry, getDefaultMaterial, MeshRenderer, Object3D, reactive, RunEnvironment, Scene, ticker, View } from 'feng3d';

let camera: Camera;
let cubeRotation: { readonly x: number; readonly y: number; readonly z: number; };
let uniforms: ColorUniforms;
let scene: Scene;

const sceneObject3D: Object3D = {
    __type__: 'Object3D',
    name: 'Untitled',
    activeSelf: true,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    components: [scene = {
        __type__: 'Scene',
        background: new Color4(0.408, 0.38, 0.357, 1.0),
        ambientColor: new Color4(),
    } as Scene],
    children: [{
        __type__: 'Object3D',
        name: 'Main Camera',
        activeSelf: true,
        position: { x: 0, y: 1, z: -10 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        components: [camera = {
            __type__: 'Camera',
        } as Camera],
        children: [],
    } as Object3D, {
        __type__: 'Object3D',
        name: 'Cube',
        activeSelf: true,
        position: { x: 0, y: 0, z: 0 },
        rotation: cubeRotation = { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        components: [{
            __type__: 'MeshRenderer',
            enabled: true,
            runEnvironment: RunEnvironment.all,
            geometry: Geometry.getDefault('Cube'),
            material: {
                __type__: 'ColorMaterial',
                name: '',
                uniforms: uniforms = { u_diffuseInput: new Color4() },
                samplers: {},
                textureViews: {},
                externalTextures: {},
            },
            castShadows: true,
            receiveShadows: true,
        } as MeshRenderer],
        children: [{
            __type__: 'Object3D',
            name: 'Cylinder',
            activeSelf: true,
            position: { x: 2, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            components: [{
                __type__: 'MeshRenderer',
                enabled: true,
                runEnvironment: RunEnvironment.all,
                geometry: Geometry.getDefault('Cylinder'),
                material: getDefaultMaterial('Default-Material'),
                castShadows: true,
                receiveShadows: true,
            } as unknown as MeshRenderer],
            children: [],
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
