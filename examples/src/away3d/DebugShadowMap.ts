import { logic, Object3D, reactive, ticker, Vector3, View, Scene } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';
import { createDebugShadowMapMaterial } from '../../../src/materials/DebugShadowMapMaterial';

/**
 * 阴影图调试场景。
 *
 * 场景：方向光（垂直向下）+ 球体/立方体（castShadows）+ 平面（receiveShadows）。
 * 另有一个调试平面，用 DebugShadowMapMaterial 把方向光的 shadowDepthTexture
 * 可视化显示（灰度 = 深度，白色=无物体/clearValue 1.0，偏暗=有物体）。
 *
 * 通过观察调试平面的灰度图，确认阴影深度图是否正确写入。
 */
const debugMat = createDebugShadowMapMaterial();

const sceneObject3D: Object3D = {
    __type__: 'Object3D',
    name: 'Untitled',
    components: [{
        __type__: 'Scene',
        background: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
        ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 0.3 },
    }],
    children: [{
        __type__: 'Object3D',
        name: 'Main Camera',
        position: { x: 0, y: 8, z: -12 },
        components: [{
            __type__: 'Camera',
        }],
    }, {
        __type__: 'Object3D',
        name: 'light1',
        rotation: { x: 90, y: 0, z: 0 },
        components: [{
            __type__: 'DirectionalLight',
            intensity: 0.7,
            color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
            shadowType: 1,
        }],
    }, {
        // 地面（接收阴影）
        __type__: 'Object3D',
        name: 'plane',
        position: { x: 0, y: -0.2, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            castShadows: false,
            geometry: { __type__: 'PlaneGeometry', width: 50, height: 50, segmentsW: 1, segmentsH: 1 },
            material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 } } },
        }],
    }, {
        // 球体（投射阴影）
        __type__: 'Object3D',
        name: 'sphere',
        position: { x: 3, y: 1.6, z: 3 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'SphereGeometry', radius: 1.5, segmentsW: 40, segmentsH: 20 },
            material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 } } },
        }],
    }, {
        // 立方体（投射阴影）
        __type__: 'Object3D',
        name: 'cube',
        position: { x: 3, y: 1.6, z: -2.5 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry', width: 2, height: 2, depth: 2 },
            material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: 0, g: 1, b: 0, a: 1 } } },
        }],
    }, {
        // 调试平面：显示阴影深度图，竖直放置（yUp:false → XY 平面，法线 +Z）面向相机
        __type__: 'Object3D',
        name: 'debugShadowMap',
        position: { x: 0, y: 2, z: -5 },
        components: [{
            __type__: 'MeshRenderer',
            castShadows: false,
            geometry: { __type__: 'PlaneGeometry', width: 8, height: 8, segmentsW: 1, segmentsH: 1, yUp: false },
            material: debugMat,
        }],
    }],
};

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();
const view: View = { __type__: 'View', canvas: webgpuCanvas, root: sceneObject3D };
const viewLogic = logic(view);

// 相机正对 debug 平面
const camera = sceneObject3D.children!.find(c => c.name === 'Main Camera')!;
reactive(camera).position = { x: 0, y: 2, z: -12 };
logic(camera).lookAt(new Vector3(0, 2, -5));

// 取方向光
const light1 = sceneObject3D.children!.find(c => c.name === 'light1')!;
const lightComponent = light1.components!.find(c => c.__type__ === 'DirectionalLight') as any;

// 每帧更新调试材质的纹理（阴影图在 ShadowRenderer 每帧渲染后更新）
ticker.onframe(() =>
{
    const sLogic = logic(lightComponent);
    const size = sLogic.shadowMapSize;
    reactive(debugMat).uniforms = { u_texSize: { x: size.x, y: size.y } };
    reactive(debugMat).s_texture = sLogic.shadowDepthTexture;
});

ticker.onframe(() => { viewLogic.update(); webgpu.submit(viewLogic.submit); });
