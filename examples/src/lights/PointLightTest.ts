import { Object3D, reactive, ticker, View, logic, Vector3, Texture2D, TextureWrap, windowEventProxy, Scene } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';

// 共享材质（diffuse + normal + specular 纹理）
function createHeadMaterial()
{
    const texDiffuse = new Texture2D(); texDiffuse.source = { url: '/head_diffuse.jpg' }; texDiffuse.wrapS = TextureWrap.MIRRORED_REPEAT; texDiffuse.wrapT = TextureWrap.MIRRORED_REPEAT;
    const texNormal = new Texture2D(); texNormal.source = { url: '/head_normals.jpg' }; texNormal.wrapS = TextureWrap.MIRRORED_REPEAT; texNormal.wrapT = TextureWrap.MIRRORED_REPEAT;
    const texSpecular = new Texture2D(); texSpecular.source = { url: '/head_specular.jpg' }; texSpecular.wrapS = TextureWrap.MIRRORED_REPEAT; texSpecular.wrapT = TextureWrap.MIRRORED_REPEAT;

    return {
        __type__: 'StandardMaterial' as const,
        s_diffuse: texDiffuse,
        s_normal: texNormal,
        s_specular: texSpecular,
    };
}

const sceneObject3D: Object3D = {
    __type__: 'Object3D',
    name: 'Untitled',
    components: [{
        __type__: 'Scene',
        background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
        ambientColor: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
    }],
    children: [{
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
            material: createHeadMaterial(),
        }],
    }, {
        __type__: 'Object3D',
        name: 'cube',
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry', width: 1, height: 1, depth: 1, scaleU: 2, scaleV: 2 },
            material: createHeadMaterial(),
        }],
    }, {
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
    }, {
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
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const view: View = { __type__: 'View', canvas: webgpuCanvas, root: sceneObject3D };
const viewLogic = logic(view);

// 相机看向原点
const cameraEntity = sceneObject3D.children!.find(c => c.name === 'Main Camera')!;
logic(cameraEntity).lookAt(new Vector3(0, 0, 0));

// 点光源旋转动画
const light0 = sceneObject3D.children!.find(c => c.name === 'pointLight0')!;
const light1 = sceneObject3D.children!.find(c => c.name === 'pointLight1')!;
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
        reactive(sceneObject3D).children.splice(0, reactive(sceneObject3D).children.length);
    }
    else if (key === 'b')
    {
        location.reload();
    }
});

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
