import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, StandardMaterial, View, ticker } from 'feng3d';

/**
 * 彩色房间 + 多点光源。
 *
 * 对照 three.js：examples/webgl_refraction.html
 * 原示例有 Refractor 水面折射，feng3d 无此特性，保留彩色房间 + 多光源场景。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 6 面彩色墙
const WALL_SIZE = 20;
const colors: [number, number, number][] = [
    [1, 0.3, 0.3], [0.3, 1, 0.3], [0.3, 0.3, 1],
    [1, 1, 0.3], [1, 0.3, 1], [0.3, 1, 1],
];
const wallNodes: Object3D[] = [];
// 后墙 z=-WALL_SIZE/2
wallNodes.push({
    __type__: 'Object3D', position: { x: 0, y: 0, z: -WALL_SIZE / 2 }, rotation: { x: 0, y: 0, z: 0 },
    components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PlaneGeometry', width: WALL_SIZE, height: WALL_SIZE },
        material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: colors[0][0], g: colors[0][1], b: colors[0][2], a: 1 }, u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, u_glossiness: 0, u_reflectivity: 0 } } }],
});
// 前墙 z=+WALL_SIZE/2
wallNodes.push({
    __type__: 'Object3D', position: { x: 0, y: 0, z: WALL_SIZE / 2 }, rotation: { x: 0, y: Math.PI, z: 0 },
    components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PlaneGeometry', width: WALL_SIZE, height: WALL_SIZE },
        material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: colors[1][0], g: colors[1][1], b: colors[1][2], a: 1 }, u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, u_glossiness: 0, u_reflectivity: 0 } } }],
});
// 左墙
wallNodes.push({
    __type__: 'Object3D', position: { x: -WALL_SIZE / 2, y: 0, z: 0 }, rotation: { x: 0, y: Math.PI / 2, z: 0 },
    components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PlaneGeometry', width: WALL_SIZE, height: WALL_SIZE },
        material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: colors[2][0], g: colors[2][1], b: colors[2][2], a: 1 }, u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, u_glossiness: 0, u_reflectivity: 0 } } }],
});
// 右墙
wallNodes.push({
    __type__: 'Object3D', position: { x: WALL_SIZE / 2, y: 0, z: 0 }, rotation: { x: 0, y: -Math.PI / 2, z: 0 },
    components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PlaneGeometry', width: WALL_SIZE, height: WALL_SIZE },
        material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: colors[3][0], g: colors[3][1], b: colors[3][2], a: 1 }, u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, u_glossiness: 0, u_reflectivity: 0 } } }],
});
// 天花板
wallNodes.push({
    __type__: 'Object3D', position: { x: 0, y: WALL_SIZE / 2, z: 0 }, rotation: { x: Math.PI / 2, y: 0, z: 0 },
    components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PlaneGeometry', width: WALL_SIZE, height: WALL_SIZE },
        material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: colors[4][0], g: colors[4][1], b: colors[4][2], a: 1 }, u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, u_glossiness: 0, u_reflectivity: 0 } } }],
});
// 地板
wallNodes.push({
    __type__: 'Object3D', position: { x: 0, y: -WALL_SIZE / 2, z: 0 }, rotation: { x: -Math.PI / 2, y: 0, z: 0 },
    components: [{ __type__: 'MeshRenderer', geometry: { __type__: 'PlaneGeometry', width: WALL_SIZE, height: WALL_SIZE },
        material: { __type__: 'StandardMaterial', uniforms: { u_diffuse: { __type__: 'Color4', r: colors[5][0], g: colors[5][1], b: colors[5][2], a: 1 }, u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 }, u_glossiness: 0, u_reflectivity: 0 } } }],
});

// 4 个移动点光源
const lightNodes: Object3D[] = [];
for (let i = 0; i < 4; i++)
{
    const hue = i / 4;
    const [r, g, b] = [Math.sin(hue * 6.28 + 0) * 0.5 + 0.5, Math.sin(hue * 6.28 + 2.1) * 0.5 + 0.5, Math.sin(hue * 6.28 + 4.2) * 0.5 + 0.5];
    lightNodes.push({
        __type__: 'Object3D', name: `light_${i}`, position: { x: 0, y: 0, z: 0 },
        components: [{ __type__: 'PointLight', color: { __type__: 'Color3', r, g, b }, intensity: 1, range: 15 }],
    });
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
            ambientColor: { __type__: 'Color4', r: 0.15, g: 0.15, b: 0.15, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 0.01 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'PerspectiveCamera', fov: 75,
                    aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 100,
                },
                { __type__: 'OrbitControls', target: { x: 0, y: 0, z: -0.01 } }],
            },
            ...wallNodes,
            ...lightNodes,
        ],
    },
};

const viewLogic = logic(view);
const startTime = Date.now();

ticker.onframe(() =>
{
    const t = (Date.now() - startTime) * 0.001;
    for (let i = 0; i < lightNodes.length; i++)
    {
        const phase = (i / 4) * Math.PI * 2;
        reactive(lightNodes[i]).position = {
            x: Math.cos(t + phase) * 5,
            y: Math.sin(t * 1.3 + phase) * 4,
            z: Math.sin(t + phase) * 5,
        };
    }
    webgpu.submit(viewLogic.submit);
});
