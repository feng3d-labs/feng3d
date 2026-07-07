import { Color4, Object3D, reactive, ticker, View } from 'feng3d';

let cubeRotation: { readonly x: number; readonly y: number; readonly z: number; };
let uniforms: { u_diffuseInput: Color4 };

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
                uniforms: uniforms = {
                    u_diffuseInput: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                },
            },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Cylinder',
            position: { x: 2, y: 0, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
            }],
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
        // 纯数据 Color4 的优势：无需构造新对象，每个通道独立响应式随机
        reactive(uniforms.u_diffuseInput).r = Math.random();
        reactive(uniforms.u_diffuseInput).g = Math.random();
        reactive(uniforms.u_diffuseInput).b = Math.random();
    }
});
