import { Object3D, reactive, Renderable, Scene, StandardMaterial, Vector3, View, logic, raycaster, Ray3, PerspectiveCamera } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';
import { windowEventProxy } from '@feng3d/shortcut';

/**
 * 移植自 three.js examples/webgl_interactive_cubes.html。
 *
 * 场景内随机散布大量立方体，相机自动环绕。鼠标悬停到的立方体实时高亮为红色，
 * 离开后还原原色——验证 feng3d 的 Raycaster 拾取能力与材质响应式更新。
 *
 * 与 three.js 原示例对齐：
 * - PerspectiveCamera(70, aspect, 1, 100)，相机绕原点环形运动（theta += 0.1，半径 5）
 * - DirectionalLight(0xffffff, 3)，position 归一化的 (1,1,1)
 * - Scene.background = 0xf0f0f0（浅灰）
 * - N 个 BoxGeometry，位置/旋转/缩放/颜色全部 Math.random() 随机化
 *
 * feng3d 适配：
 * - MeshLambertMaterial → StandardMaterial（feng3d 的 PBR 标准材质）
 * - emissive 高亮 → 切换 u_diffuse 颜色（feng3d StandardMaterial 无 emissive 字段，
 *   保存原 diffuse RGB，命中时改成红色 {1,0,0}，离开时还原）
 * - raycaster.setFromCamera(pointer, camera) → raycaster.pick(getRay3D(gx,gy), mouseCheckObjects)
 * - setAnimationLoop(animate) → requestAnimationFrame（与仓库内 ThreejsCubeTest 一致；
 *   不用 ticker.onframe 是因为后者内部固定 60Hz 时间表，高刷屏会被钳制导致旋转速度不对）
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

let scene: Scene;
let camera: PerspectiveCamera;

// ---- 构造 N 个随机立方体（对应 three.js 循环 2000 次）----
// 为控制首屏帧率，把数量下调到 500（three.js 原版 2000 在 feng3d WebGPU 下也可，但拾取
// 每帧 raycast 测试数量与对象数线性相关，500 已足够展示交互效果）。
const COUNT = 500;

interface Cube
{
    object3D: Object3D;
    material: StandardMaterial;
    /** 原始漫反射色（用于离开高亮时还原） */
    origR: number; origG: number; origB: number;
}

const cubes: Cube[] = [];

function makeCube(): Cube
{
    // 随机颜色（0~1 浮点），与 three.js Math.random() * 0xffffff → 0~1 一致
    const r = Math.random();
    const g = Math.random();
    const b = Math.random();
    const material: StandardMaterial = {
        __type__: 'StandardMaterial',
        uniforms: {
            u_diffuse: { __type__: 'Color4', r, g, b, a: 1 },
        },
    };

    const object3D: Object3D = {
        __type__: 'Object3D',
        // 位置 [-20,20)（three.js 原示例）
        position: { x: Math.random() * 40 - 20, y: Math.random() * 40 - 20, z: Math.random() * 40 - 20 },
        // 旋转 [0, 2π)
        rotation: { x: Math.random() * Math.PI * 2, y: Math.random() * Math.PI * 2, z: Math.random() * Math.PI * 2 },
        // 缩放 [0.5, 1.5)
        scale: { x: Math.random() + 0.5, y: Math.random() + 0.5, z: Math.random() + 0.5 },
        // 拾取开关：feng3d Scene.mouseCheckObjects 仅收集 mouseEnabled=true 的对象
        mouseEnabled: true,
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'CubeGeometry' },
            material,
        }],
    };

    return { object3D, material, origR: r, origG: g, origB: b };
}

// 预生成所有立方体数据（字面量 View 引用同一份 objects 数组）
for (let i = 0; i < COUNT; i++)
{
    cubes.push(makeCube());
}

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [scene = {
            __type__: 'Scene',
            // Scene.background = 0xf0f0f0
            background: { __type__: 'Color4', r: 0xf0 / 255, g: 0xf0 / 255, b: 0xf0 / 255, a: 1 },
        }],
        children: [
            // 相机：PerspectiveCamera(70, aspect, 1, 100)
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 0, y: 0, z: 5 },
                components: [camera = {
                    __type__: 'PerspectiveCamera',
                    fov: 70,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 1,
                    far: 100,
                }],
            },
            // DirectionalLight(0xffffff, 3)，position (1,1,1) 归一化（方向光位置无关紧要，仅方向有意义）
            {
                __type__: 'Object3D',
                name: 'DirectionalLight',
                position: { x: 1, y: 1, z: 1 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 3,
                }],
            },
            // 所有立方体（展开为 children）
            ...cubes.map(c => c.object3D),
        ],
    },
};

const viewLogic = logic(view);

// ---- 鼠标射线（移植 MousePickTest.getMouseRay）----
function getMouseRay(): Ray3 | null
{
    const rect = webgpuCanvas.getBoundingClientRect();
    const sx = windowEventProxy.clientX - rect.left;
    const sy = windowEventProxy.clientY - rect.top;
    // 屏幕坐标 → NDC（-1~1，Y 翻转），对应 three.js pointer.x = clientX/w*2-1
    const gx = (sx * 2 - rect.width) / rect.width;
    const gy = -(sy * 2 - rect.height) / rect.height;

    return logic(camera).getRay3D(gx, gy);
}

// ---- 高亮状态（对应 three.js 全局变量 INTERSECTED + currentHex）----
let hovered: Cube | null = null;

function setHighlight(cube: Cube | null): void
{
    if (cube === hovered) return; // 与原示例 INTERSECTED != intersects[0].object 判定一致

    // 还原旧命中对象的 diffuse
    if (hovered)
    {
        const r_diffuse = reactive(hovered.material.uniforms.u_diffuse);
        r_diffuse.r = hovered.origR;
        r_diffuse.g = hovered.origG;
        r_diffuse.b = hovered.origB;
    }
    // 新命中对象改为红色（对应 emissive.setHex(0xff0000)）
    if (cube)
    {
        const r_diffuse = reactive(cube.material.uniforms.u_diffuse);
        r_diffuse.r = 1;
        r_diffuse.g = 0;
        r_diffuse.b = 0;
    }
    hovered = cube;
}

// ---- 相机环绕动画 + 每帧拾取（对应 three.js render() 循环）----
// 用原生 requestAnimationFrame（不用 ticker.onframe）：与 three.js setAnimationLoop 行为一致，
// 都按显示器刷新率触发；ticker.onframe 内部固定 60Hz 时间表，在 120Hz/144Hz 屏上会被钳制
// 到 ~60 次/秒导致旋转慢一半。
const cameraObj = view.root!.children![0];
const origin = new Vector3(0, 0, 0);
let theta = 0;

function render(): void
{
    // 相机环绕：theta += 0.1，半径 5，绕原点（与 three.js 一致：x=sin*5, y=sin*5, z=cos*5）
    theta += 0.1;
    reactive(cameraObj).position = {
        x: Math.sin(Math.PI * theta / 180) * 5,
        y: Math.sin(Math.PI * theta / 180) * 5,
        z: Math.cos(Math.PI * theta / 180) * 5,
    };
    logic(cameraObj).lookAt(origin);

    // 每帧拾取（原示例在 render() 内 raycaster.setFromCamera + intersectObjects）
    const mouseRay3D = getMouseRay();
    let hitCube: Cube | null = null;
    if (mouseRay3D)
    {
        const hit = raycaster.pick(mouseRay3D, logic(scene).mouseCheckObjects);
        if (hit)
        {
            // mouseCheckObjects 返回的是 Object3D，反查 cubes 表
            hitCube = cubes.find(c => c.object3D === hit.object3D) ?? null;
        }
    }
    setHighlight(hitCube);

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(render);
}
requestAnimationFrame(render);
