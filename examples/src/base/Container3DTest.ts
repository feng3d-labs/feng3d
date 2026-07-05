import { Camera, Color3, Color4, ColorUniforms, CubeGeometry, FogMode, MeshRenderer, Object3D, reactive, RunEnvironment, Scene, StandardMaterial, Texture2D, TextureCube, ticker, View } from 'feng3d';

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
            runEnvironment: RunEnvironment.all,
            geometry: {
                __type__: 'CubeGeometry',
            } as CubeGeometry,
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
                runEnvironment: RunEnvironment.all,
                geometry: {
                    __type__: 'CylinderGeometry',
                },
                material: {
                    __type__: 'StandardMaterial',
                    uniforms: {
                        u_diffuse: new Color4(1, 1, 1, 1),
                        u_alphaThreshold: 0,
                        u_specular: new Color3(),
                        u_glossiness: 50,
                        u_ambient: new Color4(),
                        u_reflectivity: 1,
                        u_fogMinDistance: 0,
                        u_fogMaxDistance: 100,
                        u_fogColor: new Color3(),
                        u_fogDensity: 0.1,
                        u_fogMode: FogMode.NONE,
                    },
                    s_diffuse: Texture2D.default,
                    s_normal: Texture2D.defaultNormal,
                    s_specular: Texture2D.default,
                    s_ambient: Texture2D.default,
                    s_envMap: TextureCube.default,
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
