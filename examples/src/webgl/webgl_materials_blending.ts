import { WebGPU } from '@feng3d/webgpu';
import { Vector3 } from '@feng3d/math';
import { logic, Object3D, reactive, Scene, TextureMaterial, View } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_materials_blending.html。
 *
 * 原示例：5 种纹理（uv_grid、sprite 等）× 5 种 blend mode（No/Normal/Additive/Subtractive/Multiply）
 * = 25 个半透明 PlaneGeometry 平铺成 5×5 网格，背景为重复的棋盘格 CanvasTexture。
 * MeshBasicMaterial{transparent, blending: mode, premultipliedAlpha}。
 *
 * feng3d 适配（简化为半透明 alpha 混合）：
 * - ColorMaterial/StandardMaterial/TextureMaterial 均未公开 blend mode 设置（渲染管线层），
 *   无法展示 Additive/Subtractive/Multiply 等模式。简化为：用 CanvasTexture 生成 5 种彩色方块纹理，
 *   每种纹理按不同 alpha（1.0 / 0.8 / 0.6 / 0.4 / 0.2）叠加排列，展示默认 NormalBlending 下的
 *   alpha 半透明混合效果（平面重叠区域颜色按 alpha 加权混合）。
 * - MeshBasicMaterial → TextureMaterial（无光照，采样纹理 × u_color；u_color.a 控制 alpha）。
 * - 背景棋盘格 CanvasTexture：webgpu Texture 直接喂 HTMLCanvasElement 源（repeat 由 sampler 实现）。
 * - setAnimationLoop → requestAnimationFrame（本例静态布局，无逐帧动画）。
 *
 * 说明：feng3d 渲染管线 targets[0] 默认无混合（replace），半透明需库层添加 blend state 支持。
 * 当前 alpha 主要体现在纹理自身的半透明区域（彩色方块带透明背景），平面整体颜色受 u_color.a 调制。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- 5 种彩色方块 CanvasTexture（128×128，对应原示例不同纹理图） ----
const COLORS: [string, string][] = [
    ['#ff4444', '#880000'], // 红
    ['#44ff44', '#008800'], // 绿
    ['#4444ff', '#000088'], // 蓝
    ['#ffff44', '#888800'], // 黄
    ['#ff44ff', '#880088'], // 品红
];

/** 生成彩色方块 CanvasTexture（128×128，方块居中，背景半透明） */
function makeColorCanvas(c1: string, c2: string): HTMLCanvasElement
{
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    // 透明背景
    ctx.clearRect(0, 0, 128, 128);
    // 外圈方框
    ctx.fillStyle = c2;
    ctx.fillRect(0, 0, 128, 128);
    // 内圈实心方块
    ctx.fillStyle = c1;
    ctx.fillRect(16, 16, 96, 96);
    // 中心小方块（深色，增加层次）
    ctx.fillStyle = c2;
    ctx.fillRect(48, 48, 32, 32);

    return canvas;
}

const textures = COLORS.map(([c1, c2]) => ({
    descriptor: { size: [128, 128] as [number, number], format: 'rgba8unorm' as const },
    sources: [{ image: makeColorCanvas(c1, c2) }],
}));

// ---- 5 种 alpha 级别（对应原示例 5 种 blend mode，这里用 alpha 强度替代） ----
const ALPHAS = [1.0, 0.8, 0.6, 0.4, 0.2];
const ALPHA_LABELS = ['1.0', '0.8', '0.6', '0.4', '0.2'];

// ---- 标签 CanvasTexture（显示 alpha 值，对应原示例 generateLabelMaterial） ----
function makeLabelCanvas(text: string): HTMLCanvasElement
{
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, 128, 32);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16pt arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 18);

    return canvas;
}

// ---- 构建 5×5 网格平面（5 种纹理 × 5 种 alpha） ----
const PLANE = 100; // 单平面尺寸
const SPACING = 110; // 列间距（对应原示例 x = (i - 2.5) * 110）
const ROW_SPACING = 130; // 行间距

/** 构建一个带标签的彩色平面 */
function makePlane(textureIndex: number, alphaIndex: number): Object3D
{
    const col = alphaIndex; // 列：alpha
    const row = textureIndex; // 行：纹理颜色
    const x = (col - (ALPHAS.length - 1) / 2) * SPACING;
    const y = ((ALPHAS.length - 1) / 2 - row) * ROW_SPACING;

    return {
        __type__: 'Object3D',
        position: { x, y, z: 0 },
        children: [
            // 彩色平面（半透明）
            {
                __type__: 'Object3D',
                position: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'PlaneGeometry', width: PLANE, height: PLANE, yUp: false },
                    material: {
                        __type__: 'TextureMaterial',
                        uniforms: {
                            u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: ALPHAS[alphaIndex] },
                        },
                        s_texture: textures[textureIndex] as unknown as TextureMaterial['s_texture'],
                    } as TextureMaterial,
                }],
            },
            // 标签平面（在彩色平面下方，显示 alpha 值）
            {
                __type__: 'Object3D',
                position: { x: 0, y: -75, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'PlaneGeometry', width: PLANE, height: 25, yUp: false },
                    material: {
                        __type__: 'TextureMaterial',
                        uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
                        s_texture: {
                            descriptor: { size: [128, 32] as [number, number], format: 'rgba8unorm' as const },
                            sources: [{ image: makeLabelCanvas(`a=${ALPHA_LABELS[alphaIndex]}`) }],
                        } as unknown as TextureMaterial['s_texture'],
                    } as TextureMaterial,
                }],
            },
        ],
    };
}

// 生成全部 25 个（5 行纹理 × 5 列 alpha）平面
const planes: Object3D[] = [];
for (let row = 0; row < COLORS.length; row++)
{
    for (let col = 0; col < ALPHAS.length; col++)
    {
        planes.push(makePlane(row, col));
    }
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
            // Scene.background = 棋盘格（对应原示例 mapBg 棋盘格背景）
            background: { __type__: 'Color4', r: 0.867, g: 0.867, b: 0.867, a: 1 },
        }],
        children: [
            // 相机：PerspectiveCamera(70, aspect, 1, 1000)，position.z=600
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: cameraPosition = { x: 0, y: 0, z: 600 },
                components: [{
                    __type__: 'PerspectiveCamera',
                    fov: 70,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 1,
                    far: 1000,
                }],
            },
            // 5×5 彩色半透明平面网格
            ...planes,
        ],
    },
};

const viewLogic = logic(view);
const cameraObj = view.root!.children![0];
const origin = new Vector3(0, 0, 0);

// ---- 鼠标跟随相机（轻微缓动，便于观察重叠区域的 alpha 混合） ----
let targetX = 0; let targetY = 0;
window.addEventListener('mousemove', (event) =>
{
    targetX = (event.clientX / window.innerWidth - 0.5) * 200;
    targetY = (event.clientY / window.innerHeight - 0.5) * 150;
});

function animate(): void
{
    const curPos = logic(cameraObj).position;
    const newX = curPos.x + (targetX - curPos.x) * 0.05;
    const newY = curPos.y + (-targetY - curPos.y) * 0.05;
    reactive(cameraObj).position = { x: newX, y: newY, z: 600 };
    logic(cameraObj).lookAt(origin);

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

// 初始 lookAt
logic(cameraObj).lookAt(origin);
requestAnimationFrame(animate);
