import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';

/**
 * Box 房间 + 移动点光源。
 *
 * 对照 three.js：examples/webgl_shadowmap_pointlight.html
 * 原示例用 PointLight 阴影，feng3d 仅支持 DirectionalLight 阴影，
 * 保留 Box 房间 + 移动 PointLight 光照效果（无 PointLight 阴影）。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const ROOM = 10;

function makeWall(x: number, y: number, z: number, rx: number, ry: number, rz: number): Object3D
{
    return {
        __type__: 'Object3D', position: { x, y, z }, rotation: { x: rx, y: ry, z: rz },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'PlaneGeometry', width: ROOM, height: ROOM },
            material: {
                __type__: 'StandardMaterial',
                uniforms: { u_diffuse: { __type__: 'Color4', r: 0.7, g: 0.7, b: 0.7, a: 1 }, u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, u_glossiness: 0, u_reflectivity: 0 },
            },
        }],
    };
}

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.02, g: 0.02, b: 0.02, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 2, z: 8 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'PerspectiveCamera', fov: 60,
                    aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100,
                },
                { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } }],
            },
            // 房间 6 面墙
            makeWall(0, -ROOM / 2, 0, -Math.PI / 2, 0, 0), // 地板
            makeWall(0, ROOM / 2, 0, Math.PI / 2, 0, 0),   // 天花板
            makeWall(0, 0, -ROOM / 2, 0, 0, 0),             // 后墙
            makeWall(0, 0, ROOM / 2, 0, Math.PI, 0),         // 前墙
            makeWall(-ROOM / 2, 0, 0, 0, Math.PI / 2, 0),   // 左墙
            makeWall(ROOM / 2, 0, 0, 0, -Math.PI / 2, 0),   // 右墙
            // 中央盒子
            {
                __type__: 'Object3D', name: 'box', position: { x: 0, y: -2, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CubeGeometry', width: 2, height: 2, depth: 2 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: { u_diffuse: { __type__: 'Color4', r: 0.8, g: 0.6, b: 0.3, a: 1 }, u_specular: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.2, a: 1 }, u_glossiness: 30, u_reflectivity: 0 },
                    },
                }],
            },
            // 2 个移动点光源
            {
                __type__: 'Object3D', name: 'pl1', position: { x: 3, y: 0, z: 0 },
                components: [{ __type__: 'PointLight', color: { __type__: 'Color3', r: 1, g: 0.4, b: 0.2 }, intensity: 10, range: 15 }],
            },
            {
                __type__: 'Object3D', name: 'pl2', position: { x: -3, y: 0, z: 0 },
                components: [{ __type__: 'PointLight', color: { __type__: 'Color3', r: 0.2, g: 0.5, b: 1 }, intensity: 10, range: 15 }],
            },
        ],
    },
};

const viewLogic = logic(view);
const pl1 = view.root!.children![7];
const pl2 = view.root!.children![8];
const startTime = Date.now();

ticker.onframe(() =>
{
    const t = (Date.now() - startTime) * 0.001;
    reactive(pl1).position = { x: Math.cos(t) * 3, y: Math.sin(t) * 2, z: Math.sin(t * 0.7) * 3 };
    reactive(pl2).position = { x: Math.cos(t + Math.PI) * 3, y: Math.sin(t * 1.3 + Math.PI) * 2, z: Math.sin(t * 0.7 + Math.PI) * 3 };
    webgpu.submit(viewLogic.submit);
});
