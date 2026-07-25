import { Object3D, reactive, ticker, View, createTextureCubeFromUrls, logic, Vector3 } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';

let cameraEntity: Object3D;
let torus: Object3D;

// createTextureCubeFromUrls 返回 Promise<Texture>；await 后再构造 View
const cubeTexture = await createTextureCubeFromUrls([
    '/skybox/snow_positive_x.jpg',
    '/skybox/snow_positive_y.jpg',
    '/skybox/snow_positive_z.jpg',
    '/skybox/snow_negative_x.jpg',
    '/skybox/snow_negative_y.jpg',
    '/skybox/snow_negative_z.jpg',
]);

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
        }],
        children: [cameraEntity = {
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 0, z: -15 },
            components: [{
                __type__: 'PerspectiveCamera',
            }],
        }, {
            __type__: 'Object3D',
            name: 'skybox',
            components: [{
                __type__: 'SkyBox',
                s_skyboxTexture: cubeTexture,
            }],
        }, torus = {
            __type__: 'Object3D',
            name: 'torus',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'TorusGeometry', radius: 1.5, tubeRadius: 0.6, segmentsR: 40, segmentsT: 20 },
                material: {
                    __type__: 'StandardMaterial',
                    uniforms: {
                        u_ambient: { __type__: 'Color4', r: 0x11 / 0xff, g: 0x11 / 0xff, b: 0x11 / 0xff, a: 0.25 },
                        u_reflectivity: 1,
                    },
                    s_envMap: cubeTexture,
                },
            }],
        }],
    },
};
const viewLogic = logic(view);

// 相机看向原点
logic(cameraEntity).lookAt(new Vector3(0, 0, 0));

// Torus 旋转
ticker.onframe(() =>
{
    // 通过 logic().rotation 读取当前值（缺失字段拿到默认 {0,0,0}），整体写回 raw
    const cur = logic(torus).rotation;
    reactive(torus).rotation = { x: cur.x + 2, y: cur.y + 1, z: cur.z };
});

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
