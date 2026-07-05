import { Color4, ColorMaterial, Geometry, Material, MeshRenderer, Object3D, reactive, RunEnvironment, Scene, Camera, ticker, View } from 'feng3d';

let camera: Camera;

// 初始化颜色材质
const colorMaterial = new ColorMaterial();

let cylinder: Object3D;
let cube: Object3D;
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
    } as Object3D, cube = {
        __type__: 'Object3D',
        name: 'Cube',
        activeSelf: true,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        components: [{
            __type__: 'MeshRenderer',
            enabled: true,
            runEnvironment: RunEnvironment.all,
            geometry: Geometry.getDefault('Cube'),
            material: colorMaterial,
            castShadows: true,
            receiveShadows: true,
        } as unknown as MeshRenderer],
        children: [cylinder = {
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
                material: Material.getDefault('Default-Material'),
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
    reactive(cube.rotation).y += 1;

    num++;

    if (num % 60 == 0)
    {
        reactive(colorMaterial.uniforms).u_diffuseInput = new Color4().fromUnit(Math.random() * (1 << 32 - 1));
    }
});
