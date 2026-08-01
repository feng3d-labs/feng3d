import { WebGPU } from '@feng3d/webgpu';
import { Object3D, reactive, raycaster, Ray3, Scene, StandardMaterial, View, logic, Camera } from 'feng3d';
import { windowEventProxy } from '@feng3d/shortcut';

/**
 * 移植自 three.js examples/webgl_interactive_voxelpainter.html。
 *
 * 原示例：点击地面网格放置体素方块（BoxGeometry 50³），shift+click 删除。
 * 红色半透明 roll-over 预览方块跟随鼠标。AmbientLight + DirectionalLight 光照。
 * Raycaster 射线拾取地面/已有体素，命中点 + 面法线决定新体素位置。
 *
 * feng3d 适配：
 * - Raycaster：feng3d raycaster.pick(ray, objects) + camera.getRay3D(screenX, screenY)。
 * - 动态添加/删除体素：Object3D.children 是响应式数组，push/splice 触发场景更新。
 * - MeshBasicMaterial（roll-over 半透明）→ StandardMaterial（无光照近似，红色）。
 * - MeshLambertMaterial（体素）→ StandardMaterial（glossiness 0）。
 * - AmbientLight → Scene.ambientColor；DirectionalLight 直接用。
 * - GridHelper：feng3d 无网格辅助线，用 PlaneGeometry 地板替代。
 * - 鼠标环绕相机替代固定视角（增强交互）。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

let scene: Scene;
let camera: Camera;

// 体素尺寸
const VOXEL = 50;
// roll-over 预览方块（红色半透明）
let rollOverPos: { readonly x: number; readonly y: number; readonly z: number };

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [scene = {
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.941, g: 0.941, b: 0.941, a: 1 },
            // AmbientLight(0x606060, 3) 近似
            ambientColor: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 },
        }],
        children: [
            // 相机
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 500, y: 800, z: 1300 },
                components: [camera = {
                    __type__: 'PerspectiveCamera',
                    fov: 45,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 1,
                    far: 10000,
                }],
            },
            // roll-over 预览方块（红色）
            {
                __type__: 'Object3D',
                name: 'rollOver',
                position: rollOverPos = { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'CubeGeometry', width: VOXEL, height: VOXEL, depth: VOXEL },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 1, g: 0, b: 0, a: 0.5 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0,
                            u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                }],
            },
            // 地面（水平地板：PlaneGeometry 默认在 XY 平面，旋转 -π/2 到 XZ 平面朝上）
            {
                __type__: 'Object3D',
                name: 'floor',
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: -Math.PI / 2, y: 0, z: 0 },
                mouseEnabled: true,
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'PlaneGeometry', width: 1000, height: 1000 },
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0,
                            u_reflectivity: 0,
                        },
                    } as StandardMaterial,
                }],
            },
            // 方向光
            {
                __type__: 'Object3D',
                name: 'DirLight',
                position: { x: 1, y: 0.75, z: 0.5 },
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
const cameraObj = view.root!.children![0];
const rollOverObj = view.root!.children![1];
const floorObj = view.root!.children![2];

logic(cameraObj).lookAt({ x: 0, y: 0, z: 0 } as never);

// ---- 射线拾取 ----
function getMouseRay(): Ray3 | null
{
    const rect = webgpuCanvas.getBoundingClientRect();
    const sx = windowEventProxy.clientX - rect.left;
    const sy = windowEventProxy.clientY - rect.top;
    const gx = (sx * 2 - rect.width) / rect.width;
    const gy = -(sy * 2 - rect.height) / rect.height;

    return logic(camera).getRay3D(gx, gy);
}

/** 拾取目标物体列表：地面 + 所有已放置体素 */
function getPickObjects(): Object3D[]
{
    const voxels = logic(scene).entity!.children!.filter(c => c.name === 'voxel');

    return [floorObj, ...voxels];
}

/**
 * 计算鼠标射线在世界空间的命中信息。
 *
 * raycaster.pick 返回的 localPosition 在几何体局部空间（地面旋转后坐标系不同），
 * 这里改用射线与 y=0 地面平面直接求交，得到世界坐标命中点；同时用 raycaster.pick
 * 判断是否命中已放置的体素（用于堆叠/删除）。
 */
function getWorldHit(): { hitVoxel: Object3D | null; worldPos: { x: number; y: number; z: number } } | null
{
    const ray = getMouseRay();
    if (!ray) return null;

    // 先尝试拾取体素（用于堆叠/删除）
    const voxels = logic(scene).entity!.children!.filter(c => c.name === 'voxel');
    const voxelHit = voxels.length > 0 ? raycaster.pick(ray, voxels) : null;

    // 射线与 y=0 平面求交：origin.y + t * dir.y = 0 → t = -origin.y / dir.y
    const o = ray.origin;
    const d = ray.direction;
    let worldPos: { x: number; y: number; z: number };
    let hitVoxel: Object3D | null = null;

    if (voxelHit && voxelHit.localPosition && voxelHit.object3D)
    {
        // 命中体素：用体素的世界坐标（体素未旋转，局部=世界）
        const v = voxelHit.object3D;
        hitVoxel = v;
        const pos = logic(v).position;
        worldPos = { x: pos.x, y: pos.y, z: pos.z };
    }
    else if (Math.abs(d.y) > 0.0001)
    {
        // 命中地面：射线与 y=0 求交
        const t = -o.y / d.y;
        if (t < 0) return null;
        worldPos = { x: o.x + d.x * t, y: 0, z: o.z + d.z * t };
    }
    else
    {
        return null;
    }

    return { hitVoxel, worldPos };
}

/** 鼠标移动：更新 roll-over 预览位置 */
windowEventProxy.on('mousemove', () =>
{
    const result = getWorldHit();
    if (!result) return;
    const px = Math.floor(result.worldPos.x / VOXEL) * VOXEL + VOXEL / 2;
    const pz = Math.floor(result.worldPos.z / VOXEL) * VOXEL + VOXEL / 2;
    const py = result.hitVoxel ? result.worldPos.y + VOXEL : VOXEL / 2;
    reactive(rollOverObj).position = { x: px, y: py, z: pz };
});

/** 点击：放置/删除体素 */
windowEventProxy.on('mousedown', () =>
{
    const result = getWorldHit();
    if (!result) return;

    const target = logic(scene).entity!;

    if (windowEventProxy.shiftKey)
    {
        // shift+click：删除命中的体素
        if (result.hitVoxel)
        {
            const idx = target.children!.indexOf(result.hitVoxel);
            if (idx >= 0) target.children!.splice(idx, 1);
        }
    }
    else
    {
        // click：放置新体素
        const px = Math.floor(result.worldPos.x / VOXEL) * VOXEL + VOXEL / 2;
        const pz = Math.floor(result.worldPos.z / VOXEL) * VOXEL + VOXEL / 2;
        const py = result.hitVoxel ? result.worldPos.y + VOXEL : VOXEL / 2;
        const voxel: Object3D = {
            __type__: 'Object3D',
            name: 'voxel',
            position: { x: px, y: py, z: pz },
            mouseEnabled: true,
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry', width: VOXEL, height: VOXEL, depth: VOXEL },
                material: {
                    __type__: 'StandardMaterial',
                    uniforms: {
                        u_diffuse: { __type__: 'Color4', r: 0.996, g: 0.718, b: 0.298, a: 1 },
                        u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                        u_glossiness: 0,
                        u_reflectivity: 0,
                    },
                } as StandardMaterial,
            }],
        };
        target.children!.push(voxel);
    }
});

// ---- 鼠标环绕相机 ----
let camAngle = 0;
window.addEventListener('mousemove', (e) =>
{
    camAngle = (e.clientX / window.innerWidth - 0.5) * Math.PI * 0.8;
});

function animate(): void
{
    const cur = logic(cameraObj).position;
    const r = 1500;
    const curAngle = Math.atan2(cur.z, cur.x);
    const newAngle = curAngle + (camAngle - curAngle) * 0.03;
    reactive(cameraObj).position = { x: Math.cos(newAngle) * r, y: 800, z: Math.sin(newAngle) * r };
    logic(cameraObj).lookAt({ x: 0, y: 0, z: 0 } as never);

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
