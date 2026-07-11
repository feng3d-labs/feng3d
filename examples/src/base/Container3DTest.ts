import { Color4, Object3D, reactive, ticker, View, Renderable, logic, StandardMaterial } from 'feng3d';

let cubeRotation: { readonly x: number; readonly y: number; readonly z: number; };
let u_diffuseInput: Color4;

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
        position: { x: 0, y: 1, z: -10 },
        components: [{
            __type__: 'Camera',
        }],
    }, {
        __type__: 'Object3D',
        name: 'Cube',
        rotation: cubeRotation = { x: 0, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry' },
            material: {
                __type__: 'ColorMaterial',
                uniforms: {
                    u_diffuseInput: u_diffuseInput = { __type__: 'Color4' },
                },
            },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Cylinder',
            position: { x: 2, y: 0, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CylinderGeometry' },
            }],
        }],
    }, {
        __type__: 'Object3D',
        name: 'StdCube',
        position: { x: -4, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry' },
            material: {
                __type__: 'StandardMaterial',
            },
        }],
    }],
};

const engine = new View(null, sceneObject3D);

// 获取 StdCube 的 StandardMaterial，测试 u_diffuse 变色
const stdCube = sceneObject3D.children!.find(c => c.name === 'StdCube')!;
const stdRenderable = stdCube.components!.find(c => c.__type__ === 'MeshRenderer') as unknown as Renderable;
// 确保 material 的 logic 已初始化（触发 applyDefaults 填充 uniforms）
logic(stdRenderable.material as any);

let num = 0;
ticker.onframe(() =>
{
    // 变化旋转与颜色
    reactive(cubeRotation).y += 1;

    num++;

    // ColorMaterial u_diffuseInput（已知可变色）— 每 60 帧
    if (num % 60 == 0)
    {
        reactive(u_diffuseInput).r = Math.random();
        reactive(u_diffuseInput).g = Math.random();
        reactive(u_diffuseInput).b = Math.random();
    }

    // StandardMaterial u_diffuse（测试是否变色）— 每帧渐变
    const stdMaterial = stdRenderable.material as StandardMaterial;
    if (stdMaterial?.uniforms?.u_diffuse)
    {
        const t = num * 0.01;
        reactive(stdMaterial.uniforms.u_diffuse).r = 0.5 + 0.5 * Math.sin(t);
        reactive(stdMaterial.uniforms.u_diffuse).g = 0.5 + 0.5 * Math.sin(t + 2);
        reactive(stdMaterial.uniforms.u_diffuse).b = 0.5 + 0.5 * Math.sin(t + 4);
    }
});
