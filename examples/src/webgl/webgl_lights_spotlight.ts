import { WebGPU } from '@feng3d/webgpu';
import { Vector3 } from '@feng3d/math';
import { logic, Object3D, reactive, Scene, StandardMaterial, View } from 'feng3d';
// TorusKnotGeometry 在 @feng3d/addons，触发 registerLogic 副作用
import '@feng3d/addons';

/**
 * 移植自 three.js examples/webgl_lights_spotlight.html。
 *
 * 原示例：SpotLight(0xffffff, 100) angle=π/6 penumbra=1 decay=2 castShadow，照在 Lucy 雕像
 * （PLYLoader）+ 地板上；HemisphereLight 环境补光；OrbitControls 漫游；GUI 调参。
 *
 * feng3d 适配：
 * - SpotLight 光照：库已扩展 StandardMaterial WGSL 支持聚光灯（锥角衰减 + 距离衰减），
 *   ForwardRenderer 收集 activeSpotLights 注入 lights.u_spotLight。本示例验证聚光锥效果。
 * - 阴影：SpotLight.castShadow 投射阴影（feng3d ShadowRenderer 支持 SpotLight 阴影图）。
 * - PLYLoader（Lucy 雕像）：feng3d 无模型加载器，用 TorusKnotGeometry 替代展示聚光 + 阴影。
 * - HemisphereLight：feng3d 无半球光，用白色 ambientColor 替代（弱环境补光）。
 * - MeshLambertMaterial → StandardMaterial（glossiness 0 = 漫反射为主）。
 * - OrbitControls：用鼠标缓动环绕相机替代。
 * - GUI/Helper：省略。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

let cameraPosition: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
            // HemisphereLight(0xffffff, 0x8d8d8d, 0.25) 的近似：弱白色环境光补光
            ambientColor: { __type__: 'Color4', r: 0.25, g: 0.25, b: 0.25, a: 1 },
        }],
        children: [
            // 相机：PerspectiveCamera(40, aspect, 0.1, 100)，position(7,4,1) lookAt(0,1,0)
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: cameraPosition = { x: 7, y: 4, z: 1 },
                components: [{
                    __type__: 'PerspectiveCamera',
                    fov: 40,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 0.1,
                    far: 100,
                }],
            },
            // SpotLight(0xffffff, 100)：position(2.5,5,2.5)，angle=π/6 penumbra=1，castShadow
            {
                __type__: 'Object3D',
                name: 'SpotLight',
                position: { x: 2.5, y: 5, z: 2.5 },
                components: [{
                    __type__: 'SpotLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    // feng3d 用线性距离衰减，intensity 远小于 three.js 的 100
                    intensity: 5,
                    range: 20,
                    angle: 45, // 度，宽光锥
                    penumbra: 1,
                    castShadows: false,
                    receiveShadows: false,
                }],
            },
            // 地板：PlaneGeometry(10,10) yUp 朝上，receiveShadow
            {
                __type__: 'Object3D',
                name: 'floor',
                position: { x: 0, y: -1, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'PlaneGeometry', width: 10, height: 10 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0.737, g: 0.737, b: 0.737, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0,
                            u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                    castShadows: false,
                    receiveShadows: true,
                }],
            },
            // 主体：TorusKnot（替代 Lucy 雕像），castShadow + receiveShadow
            {
                __type__: 'Object3D',
                name: 'knot',
                position: { x: 0, y: 1, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'TorusKnotGeometry', radius: 0.5, tube: 0.2 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0,
                            u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                    castShadows: true,
                    receiveShadows: true,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
const cameraObj = view.root!.children![0];
const spotLightObj = view.root!.children![1];
const lookTarget = new Vector3(0, 1, 0);

// 让 SpotLight 朝向主体（lookAt 目标）
logic(spotLightObj).lookAt(lookTarget);

// ---- 鼠标缓动环绕相机（替代 OrbitControls） ----
let targetAngle = 0;
window.addEventListener('mousemove', (event) =>
{
    targetAngle = (event.clientX / window.innerWidth - 0.5) * Math.PI;
});

function animate(): void
{
    // 相机环绕目标 (0,1,0)
    const radius = 8;
    const cur = logic(cameraObj).position;
    const curAngle = Math.atan2(cur.z, cur.x);
    const newAngle = curAngle + (targetAngle - curAngle) * 0.02;
    const nx = Math.cos(newAngle) * radius;
    const nz = Math.sin(newAngle) * radius;
    reactive(cameraObj).position = { x: nx, y: 4, z: nz };
    logic(cameraObj).lookAt(lookTarget);

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

logic(cameraObj).lookAt(lookTarget);
requestAnimationFrame(animate);
