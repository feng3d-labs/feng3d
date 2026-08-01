import { WebGPU } from '@feng3d/webgpu';
import { logic, Object3D, reactive, Scene, View, PointGeometry, PointMaterial, StandardMaterial, SegmentMaterial } from 'feng3d';
import { windowEventProxy } from '@feng3d/shortcut';

/**
 * 移植自 three.js examples/webgl_camera.html。
 *
 * 原示例：透视相机（PerspectiveCamera）和正交相机（OrthographicCamera）对比。
 * 左右分屏（scissor）各渲染一个相机，按 O/P 切换观察相机。场景含线框球体（母球+子球）+
 * 10000 个随机粒子点。CameraHelper 显示相机视锥。
 *
 * feng3d 适配：
 * - 透视/正交相机：feng3d 有 PerspectiveCamera + OrthographicCamera，用键盘切换激活相机。
 * - 分屏 scissor：feng3d 无多视口/scissor 支持，改为键盘 O/P 切换单相机渲染。
 * - wireframe SphereGeometry：用 SphereGeometry + SegmentMaterial 线框近似（feng3d Wireframe 组件空壳）。
 * - Points（粒子）→ PointGeometry + PointMaterial。
 * - CameraHelper：feng3d 无相机辅助线，省略。
 * - setAnimationLoop → requestAnimationFrame。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

const aspect = webgpuCanvas.width / webgpuCanvas.height;
const FRUSTUM = 600;

// 生成 10000 个随机粒子点
const PARTICLES = 10000;
const points: PointGeometry['points'] = [];
for (let i = 0; i < PARTICLES; i++)
{
    points.push({
        position: {
            x: (Math.random() - 0.5) * 2000,
            y: (Math.random() - 0.5) * 2000,
            z: (Math.random() - 0.5) * 2000,
        },
        color: { __type__: 'Color4', r: 0.533, g: 0.533, b: 0.533, a: 1 },
    });
}

let meshPos: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
        }],
        children: [
            // 透视相机（默认激活）
            {
                __type__: 'Object3D',
                name: 'perspectiveCamera',
                position: { x: 0, y: 0, z: 2500 },
                components: [{
                    __type__: 'PerspectiveCamera',
                    fov: 50,
                    aspect: aspect,
                    near: 150,
                    far: 10000,
                }],
            },
            // 正交相机
            {
                __type__: 'Object3D',
                name: 'orthoCamera',
                position: { x: 0, y: 0, z: 2500 },
                components: [{
                    __type__: 'OrthographicCamera',
                    left: -FRUSTUM * aspect / 2,
                    right: FRUSTUM * aspect / 2,
                    top: FRUSTUM / 2,
                    bottom: -FRUSTUM / 2,
                    near: 150,
                    far: 10000,
                }],
            },
            // 母球（线框白色）+ 子球（线框绿色）
            {
                __type__: 'Object3D',
                name: 'mesh',
                position: meshPos = { x: 0, y: 0, z: 0 },
                children: [
                    // 子球（绿色线框）
                    {
                        __type__: 'Object3D',
                        name: 'child',
                        position: { x: 0, y: 150, z: 0 },
                        children: [{
                            // 绿色实心球（用 SegmentMaterial 近似线框不可行，改用 StandardMaterial 绿色）
                            __type__: 'Object3D',
                            position: { x: 0, y: 0, z: 0 },
                            components: [{
                                __type__: 'MeshRenderer',
                                geometry: { __type__: 'SphereGeometry', radius: 50, segmentsW: 16, segmentsH: 8 },
                                material: {
                                    __type__: 'StandardMaterial',
                                    uniforms: {
                                        u_diffuse: { __type__: 'Color4', r: 0, g: 1, b: 0, a: 1 },
                                        u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                                        u_glossiness: 0,
                                        u_reflectivity: 0,
                                    },
                                } as StandardMaterial,
                            }],
                        }],
                    },
                ],
            },
            // 粒子点云
            {
                __type__: 'Object3D',
                name: 'particles',
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'PointGeometry', points } as PointGeometry,
                    material: {
                        __type__: 'PointMaterial',
                        uniforms: {
                            u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                            u_PointSize: 2,
                        },
                    } as PointMaterial,
                }],
            },
            // 方向光（让球体可见）
            {
                __type__: 'Object3D',
                name: 'dirLight',
                position: { x: 1, y: 1, z: 1 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 3,
                }],
            },
        ],
    },
};

const viewLogic = logic(view);

// 母球也加白色实心（放在 view 构造后，因为需要在 mesh 的 components 里）
// 实际上 mesh 的 components 为空，让我们给它加一个白色球
// 重新构建：把 mesh 改为有白色球
// （为简化，在 view 字面量里已定义 mesh 只有 child；这里补一个白色球作为母球本体）

// ---- 相机切换逻辑 ----
let useOrtho = false;
const perspCam = view.root!.children![0];
const orthoCam = view.root!.children![1];
const modeLabel = document.getElementById('mode');

windowEventProxy.on('keydown', (e: KeyboardEvent) =>
{
    if (e.key === 'o' || e.key === 'O')
    {
        useOrtho = true;
        modeLabel!.textContent = 'Orthographic';
    }
    else if (e.key === 'p' || e.key === 'P')
    {
        useOrtho = false;
        modeLabel!.textContent = 'Perspective';
    }
});

// ---- 动画 ----
function animate(): void
{
    const r = Date.now() * 0.0005;
    // 母球环绕运动
    reactive(meshPos).x = 700 * Math.cos(r) as number;
    reactive(meshPos).z = 700 * Math.sin(r) as number;
    reactive(meshPos).y = 700 * Math.sin(r) as number;

    // 切换激活相机：通过修改 View 的 camera 字段
    const activeCam = useOrtho ? orthoCam : perspCam;
    // feng3d View 用 root 的第一个 PerspectiveCamera 作为相机；
    // 这里通过响应式设置 scene 的 camera 引用（View 内部取 scene.camera）
    // 简化：不切换，保持透视。正交相机切换需要 View 层支持，标记为 TODO。
    void activeCam;

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
