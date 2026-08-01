import { WebGPU } from '@feng3d/webgpu';
import { Vector3 } from '@feng3d/math';
import { createTextureFromUrl, logic, Object3D, reactive, Scene, TextureMaterial, View } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_materials_texture_filters.html。
 *
 * 原示例：左右分屏（scissor）对比纹理过滤模式。左半 Linear 过滤（平滑）、右半 Nearest
 * 过滤（马赛克）。每半各有一个棋盘格地面（CanvasTexture repeat 1000×1000）+ 一幅画作
 * （Caravaggio），相机俯视、鼠标缓动跟随。MeshBasicMaterial 无光照。
 *
 * feng3d 适配：
 * - CanvasTexture（程序化棋盘格）→ webgpu Texture 直接喂 HTMLCanvasElement 源
 *   （{ descriptor:{size,format}, sources:[{image: canvas}] }）。
 * - Texture.magFilter/minFilter → TextureMaterial.sampler（库已扩展支持自定义 Sampler）。
 *   左侧用 linear 采样器（默认），右侧用 nearest 采样器。
 * - MeshBasicMaterial → TextureMaterial（无光照，采样纹理 × u_color）。
 * - 分屏 scissor：feng3d 暂无多视口/scissor 支持（渲染管线级改动），改为单 scene 内左右两套
 *   mesh 并排呈现（左 Linear / 右 Nearest），核心过滤对比效果保留。
 * - 棋盘格 repeat：three.js textureCanvas.repeat.set(1000,1000)；feng3d 用 PlaneGeometry 的
 *   scaleU/scaleV（库已修：原字段声明未作用于 UV，现已生效）× 1000 + sampler addressMode repeat。
 * - 鼠标跟随相机（对应原 onDocumentMouseMove + camera.position lerp 0.05）。
 * - setAnimationLoop → requestAnimationFrame。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- 棋盘格 CanvasTexture（128×128，对应原示例 imageCanvas） ----
const checkerCanvas = document.createElement('canvas');
checkerCanvas.width = checkerCanvas.height = 128;
const ctx = checkerCanvas.getContext('2d')!;
ctx.fillStyle = '#444';
ctx.fillRect(0, 0, 128, 128);
ctx.fillStyle = '#fff';
ctx.fillRect(0, 0, 64, 64);
ctx.fillRect(64, 64, 64, 64);
const checkerTexture = {
    descriptor: { size: [128, 128] as [number, number], format: 'rgba8unorm' as const },
    sources: [{ image: checkerCanvas }],
};

// ---- 加载画作纹理（Caravaggio） ----
const paintingTexture = await createTextureFromUrl('/758px-Canestra_di_frutta_(Caravaggio).jpg');
const PAINTING_W = 758, PAINTING_H = 600;

// ---- Linear vs Nearest 采样器 ----
const linearSampler = {
    addressModeU: 'repeat' as const, addressModeV: 'repeat' as const,
    magFilter: 'linear' as const, minFilter: 'linear' as const,
    mipmapFilter: 'linear' as const, maxAnisotropy: 1,
};
const nearestSampler = {
    addressModeU: 'repeat' as const, addressModeV: 'repeat' as const,
    magFilter: 'nearest' as const, minFilter: 'nearest' as const,
    mipmapFilter: 'nearest' as const,
};

/**
 * 构建一套（棋盘格地面 + 画作 + 画框 + 阴影），用指定采样器。
 * 对应原示例 scene（Linear）/ scene2（Nearest）。
 */
function buildSet(side: number, sampler: typeof linearSampler): Object3D[]
{
    // 棋盘格地面：PlaneGeometry(100) × scale 1000，旋转 -π/2 平铺。repeat 1000 让格子在远处密集。
    // 地面 y 由画作高度决定（floorHeight），与原示例一致。
    const floorHeight = -1.117 * PAINTING_H / 2;
    // 地面纹理 repeat：通过 UV 实现 1000×1000 重复需要几何 UV 放大；这里用 scale 放大平面 + 单 UV 近似。
    // 原示例 textureCanvas.repeat.set(1000,1000) —— feng3d Texture 暂无 repeat 字段，用大 scale + 默认 repeat
    // 寻址（Sampler addressMode repeat）让格子铺满。
    const floor: TextureMaterial = {
        __type__: 'TextureMaterial',
        uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
        s_texture: checkerTexture as unknown as TextureMaterial['s_texture'],
        sampler,
    };
    // 画作（带白底 color 0xffccaa 在 Nearest 侧）
    const painting: TextureMaterial = {
        __type__: 'TextureMaterial',
        uniforms: { u_color: { __type__: 'Color4', r: 1, g: 0.8, b: 0.67, a: 1 } },
        s_texture: paintingTexture,
        sampler,
    };
    // x 偏移：左套 -800，右套 +800（并排）
    const offsetX = side * 800;

    return [
        // 棋盘格地面：PlaneGeometry(100) × scale 1000，scaleU/V=1000 让 128px 棋盘格 repeat 1000 次
        // （配合 sampler addressMode repeat），远处格子密集 → Linear/Nearest 过滤差异才明显。
        {
            __type__: 'Object3D',
            position: { x: offsetX, y: floorHeight, z: 0 },
            rotation: { x: -Math.PI / 2, y: 0, z: 0 },
            scale: { x: 1000, y: 1000, z: 1 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'PlaneGeometry', width: 100, height: 100, scaleU: 1000, scaleV: 1000 },
                material: floor,
            }],
        },
        // 画作（站立，yUp:false → 法线 -Z，面向 +Z 相机；与 three.js PlaneGeometry 默认朝向对齐）
        {
            __type__: 'Object3D',
            position: { x: offsetX, y: 0, z: 0 },
            scale: { x: PAINTING_W / 100, y: PAINTING_H / 100, z: 1 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'PlaneGeometry', width: 100, height: 100, yUp: false },
                material: painting,
            }],
        },
    ];
}

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
        }],
        children: [
            // 相机：PerspectiveCamera(35, aspect, 1, 5000)，position.z=1500，鼠标缓动跟随
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: cameraPosition = { x: 0, y: 0, z: 1500 },
                components: [{
                    __type__: 'PerspectiveCamera',
                    fov: 35,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 1,
                    far: 5000,
                }],
            },
            // 左套：Linear 过滤
            ...buildSet(-1, linearSampler),
            // 右套：Nearest 过滤
            ...buildSet(1, nearestSampler),
        ],
    },
};

const viewLogic = logic(view);
const cameraObj = view.root!.children![0];
const origin = new Vector3(0, 0, 0);

// ---- 鼠标跟随相机（对应原 onDocumentMouseMove + camera.position lerp 0.05） ----
let targetX = 0; let targetY = 0;
window.addEventListener('mousemove', (event) =>
{
    targetX = event.clientX - window.innerWidth / 2;
    targetY = event.clientY - window.innerHeight / 2;
});

function animate(): void
{
    const curPos = logic(cameraObj).position;
    const newX = curPos.x + (targetX - curPos.x) * 0.05;
    const newY = curPos.y + (-(targetY - 200) - curPos.y) * 0.05;
    reactive(cameraObj).position = { x: newX, y: newY, z: 1500 };
    logic(cameraObj).lookAt(origin);

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
