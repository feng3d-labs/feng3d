import { Object3D, reactive, ticker, View, logic, Vector3, createTextureFromUrl, windowEventProxy } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';

let cameraEntity: Object3D;
let light0: Object3D;
let light1: Object3D;
let root: Object3D;

// 共享材质（diffuse + normal + specular 纹理）。
// wrapS/wrapT = MIRRORED_REPEAT 上移到 material.samplers.s_diffuseSampler 等
// （texture 不再携带 wrap 配置）。
async function createHeadMaterial()
{
    const [texDiffuse, texNormal, texSpecular] = await Promise.all([
        createTextureFromUrl('/head_diffuse.jpg'),
        createTextureFromUrl('/head_normals.jpg'),
        createTextureFromUrl('/head_specular.jpg'),
    ]);

    return {
        __type__: 'StandardMaterial' as const,
        s_diffuse: texDiffuse,
        s_normal: texNormal,
        s_specular: texSpecular,
        // MIRRORED_REPEAT wrap 配置上移到 samplers（key 名与 WGSL 一致：<textureKey>Sampler）
        samplers: {
            s_diffuseSampler: { addressModeU: 'mirror-repeat' as const, addressModeV: 'mirror-repeat' as const },
            s_normalSampler: { addressModeU: 'mirror-repeat' as const, addressModeV: 'mirror-repeat' as const },
            s_specularSampler: { addressModeU: 'mirror-repeat' as const, addressModeV: 'mirror-repeat' as const },
        },
    };
}

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 先 await 共享材质（内含纹理 Promise），再构造 View
const headMaterial = await createHeadMaterial();

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: root = {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
            ambientColor: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
        }],
        children: [cameraEntity = {
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 2, z: -5 },
            components: [{
                __type__: 'Camera',
            }, {
                __type__: 'FPSController',
            }],
        }, {
            __type__: 'Object3D',
            name: 'plane',
            position: { x: 0, y: -1, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'PlaneGeometry', width: 10, height: 10, segmentsW: 1, segmentsH: 1, yUp: false, scaleU: 2, scaleV: 2 },
                material: headMaterial,
            }],
        }, {
            __type__: 'Object3D',
            name: 'cube',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry', width: 1, height: 1, depth: 1, scaleU: 2, scaleV: 2 },
                material: headMaterial,
            }],
        }, light0 = {
            __type__: 'Object3D',
            name: 'pointLight0',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'SphereGeometry', radius: 0.05, segmentsW: 8, segmentsH: 6, yUp: true },
                material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 } } },
            }, {
                __type__: 'PointLight',
                color: { __type__: 'Color3', r: 1, g: 0, b: 0 },
            }],
        }, light1 = {
            __type__: 'Object3D',
            name: 'pointLight1',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'SphereGeometry', radius: 0.05, segmentsW: 8, segmentsH: 6, yUp: true },
                material: { __type__: 'ColorMaterial', uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0, g: 1, b: 0, a: 1 } } },
            }, {
                __type__: 'DirectionalLight',
                color: { __type__: 'Color3', r: 0, g: 1, b: 0 },
            }],
        }],
    },
};
const viewLogic = logic(view);

// 相机看向原点
logic(cameraEntity).lookAt(new Vector3(0, 0, 0));

// 点光源旋转动画
ticker.onframe(() =>
{
    const time = Date.now();
    let angle = time / 1000;
    reactive(light0.position).y = 3;
    reactive(light0.position).x = Math.sin(angle) * 3;
    reactive(light0.position).z = Math.cos(angle) * 3;

    angle = angle + Math.PI / 2;
    reactive(light1.position).y = 3;
    reactive(light1.position).x = Math.sin(angle) * 3;
    reactive(light1.position).z = Math.cos(angle) * 3;
    logic(light1).lookAt(new Vector3(0, 0, 0));
});

// 键盘交互：C 清空场景，B 重建
windowEventProxy.on('keyup', (event) =>
{
    const key = String.fromCharCode(event.data.keyCode).toLocaleLowerCase();
    if (key === 'c')
    {
        reactive(root).children.splice(0, reactive(root).children.length);
    }
    else if (key === 'b')
    {
        location.reload();
    }
});

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
