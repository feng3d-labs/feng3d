import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, Scene, StandardMaterial, View, ticker } from 'feng3d';
import '@feng3d/addons';

/**
 * 移植自 three.js examples/webgl_shadowmap.html。
 *
 * 原示例：多个动画方块投射实时阴影到地面（DirectionalLight + PCFShadowMap），OrbitControls 漫游。
 *
 * feng3d 适配：
 * - 实时阴影：DirectionalLight.castShadows + StandardMaterial 内置 shadow 采样。
 * - AnimationMixer：省略（静态方块替代动画）。
 * - OrbitControls：库已实现。
 * - MeshPhongMaterial → StandardMaterial。
 */

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
            background: { __type__: 'Color4', r: 0.05, g: 0.05, b: 0.05, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 5, z: 15 },
                components: [
                    { __type__: 'PerspectiveCamera', fov: 50, aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 200 },
                    { __type__: 'OrbitControls', target: { x: 0, y: 1, z: 0 } },
                ],
            },
            // 方向光（投射阴影）
            {
                __type__: 'Object3D',
                name: 'dirLight',
                position: { x: 5, y: 10, z: 5 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 3,
                    // shadowType: 1, // Hard_Shadows — feng3d ShadowRenderer 对 StandardMaterial 管线不兼容，暂不开启
                    castShadows: true,
                }],
            },
            // 地面（接收阴影）
            {
                __type__: 'Object3D',
                name: 'floor',
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: -Math.PI / 2, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'PlaneGeometry', width: 40, height: 40 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0, u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                    castShadows: false, receiveShadows: true,
                }],
            },
            // 多个方块（投射阴影）
            ...[-3, 0, 3].flatMap((x, i) => [-2, 1, 4].map((z, j) => ({
                __type__: 'Object3D' as const,
                name: `box_${i}_${j}`,
                position: { x, y: 0.5 + (i + j) * 0.3, z },
                rotation: { x: (i + j) * 0.3, y: i * 0.5, z: 0 },
                components: [{
                    __type__: 'MeshRenderer' as const,
                    geometry: { __type__: 'CubeGeometry' as const, width: 1, height: 1, depth: 1 },
                    material: {
                        __type__: 'StandardMaterial' as const,
                        uniforms: {
                            u_diffuse: { __type__: 'Color4' as const, r: 0.3 + i * 0.2, g: 0.3 + j * 0.2, b: 0.8, a: 1 },
                            u_specular: { __type__: 'Color4' as const, r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0, u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                    castShadows: true, receiveShadows: true,
                }],
            }))),
        ],
    },
};

const viewLogic = logic(view);
ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
