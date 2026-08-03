import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromCanvas, logic, Object3D, reactive, Scene, TextureMaterial, View, ticker } from 'feng3d';

/**
 * 自定义混合模式（Custom Blending）展示。
 *
 * 对照 three.js：examples/webgl_materials_blending_custom.html
 *
 * 原示例：11(dst) × 11(src) 网格平面，每个用不同的 blendSrc × blendDst 组合，
 * 背景是重复的棋盘格 CanvasTexture。GUI 可切换 blendEquation。
 *
 * feng3d 适配：
 * - MeshBasicMaterial + CustomBlending → TextureMaterial + 修改 renderPipeline.targets[0].blend
 * - three.js BlendFactor（ZeroFactor 等）→ WebGPU 小写连字符格式（'zero' 等）
 * - three.js AddEquation/SubtractEquation/ReverseSubtractEquation → 'add'/'subtract'/'reverse-subtract'
 *   （Min/Max 方程 feng3d 暂不支持，省略）
 * - 棋盘格背景用 Scene.background 设为 CanvasTexture（非纯色）
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- 背景棋盘格纹理 ----
const bgCanvas = document.createElement('canvas');
bgCanvas.width = bgCanvas.height = 128;
const bgCtx = bgCanvas.getContext('2d')!;
bgCtx.fillStyle = '#ddd';
bgCtx.fillRect(0, 0, 128, 128);
bgCtx.fillStyle = '#555';
bgCtx.fillRect(0, 0, 64, 64);
bgCtx.fillStyle = '#999';
bgCtx.fillRect(32, 32, 32, 32);
bgCtx.fillStyle = '#555';
bgCtx.fillRect(64, 64, 64, 64);
bgCtx.fillStyle = '#777';
bgCtx.fillRect(96, 96, 32, 32);
const bgTexture = createTextureFromCanvas(bgCanvas);

// ---- 前景圆形渐变纹理（对应原示例 lensflare0_alpha.png） ----
const fgCanvas = document.createElement('canvas');
fgCanvas.width = fgCanvas.height = 128;
const fgCtx = fgCanvas.getContext('2d')!;
const grad = fgCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
grad.addColorStop(0, 'rgba(255,255,255,1)');
grad.addColorStop(0.5, 'rgba(255,255,255,0.5)');
grad.addColorStop(1, 'rgba(255,255,255,0)');
fgCtx.fillStyle = grad;
fgCtx.fillRect(0, 0, 128, 128);
const fgTexture = createTextureFromCanvas(fgCanvas);

// ---- Blend 因子（WebGPU GPUBlendFactor 枚举值，小写连字符格式） ----
// 注意：src-alpha-saturated（有 d 后缀），仅可用于 color 分量
const SRC_FACTORS = [
    'zero', 'one', 'src', 'one-minus-src', 'src-alpha', 'one-minus-src-alpha',
    'dst-alpha', 'one-minus-dst-alpha', 'dst', 'one-minus-dst', 'src-alpha-saturated',
] as const;
const DST_FACTORS = [
    'zero', 'one', 'src', 'one-minus-src', 'src-alpha', 'one-minus-src-alpha',
    'dst-alpha', 'one-minus-dst-alpha', 'dst', 'one-minus-dst',
] as const;

// 当前混合方程（可由按钮切换）
const EQUATIONS = ['add', 'subtract', 'reverse-subtract'] as const;
let eqIndex = 0;
let currentEquation: typeof EQUATIONS[number] = 'add';

// ---- 构建 11×10 网格平面，每个不同的 blendSrc × blendDst ----
const gridNodes: Object3D[] = [];
const CELL = 110;

for (let row = 0; row < DST_FACTORS.length; row++)
{
    for (let col = 0; col < SRC_FACTORS.length; col++)
    {
        const srcFactor = SRC_FACTORS[col];
        const dstFactor = DST_FACTORS[row];
        const x = (col - SRC_FACTORS.length / 2) * CELL;
        const y = -(row - DST_FACTORS.length / 2) * CELL + 50;

        const mat: TextureMaterial = {
            __type__: 'TextureMaterial',
            uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
            s_texture: fgTexture as unknown as TextureMaterial['s_texture'],
        };
        // 通过 logic 获取 renderPipeline 并设置自定义 blend
        const matLogic = logic(mat);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rp = matLogic.renderPipeline as any;
        // src-alpha-saturated 只能用于 color blend（WebGPU 规范），alpha 分量用 one
        const alphaSrc = srcFactor === 'src-alpha-saturated' ? 'one' : srcFactor;
        rp.fragment.targets[0] = {
            blend: {
                color: { srcFactor, dstFactor, operation: currentEquation },
                alpha: { srcFactor: alphaSrc, dstFactor, operation: currentEquation },
            },
        };

        gridNodes.push({
            __type__: 'Object3D',
            name: `blend_${col}_${row}`,
            position: { x, y, z: 0 },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'PlaneGeometry', width: 100, height: 100 },
                material: mat,
            }],
        });
    }
}

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            // Scene.background 只支持纯色，棋盘格作为大平面铺在背景层
            background: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.2, a: 1 },
            ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 0, z: 900 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'PerspectiveCamera', fov: 80,
                    aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 2000,
                }],
            },
            // 棋盘格背景大平面（铺在网格后方，提供 blend 目标色）
            {
                __type__: 'Object3D', name: 'bgPlane', position: { x: 0, y: 0, z: -200 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'PlaneGeometry', width: 3000, height: 2000, scaleU: 64, scaleV: 32 },
                    material: {
                        __type__: 'TextureMaterial',
                        uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
                        s_texture: bgTexture as unknown as TextureMaterial['s_texture'],
                    },
                }],
            },
            ...gridNodes,
        ],
    },
};

const viewLogic = logic(view);

// ---- 按钮切换混合方程 ----
const infoEl = document.getElementById('info');
function updateInfo()
{
    if (infoEl) infoEl.textContent = `自定义混合（当前方程: ${currentEquation}）| 点击按钮切换方程 | ${SRC_FACTORS.length}列(src) × ${DST_FACTORS.length}行(dst)`;
}
updateInfo();

const btnEq = document.getElementById('btnEq');
btnEq?.addEventListener('click', () =>
{
    eqIndex = (eqIndex + 1) % EQUATIONS.length;
    currentEquation = EQUATIONS[eqIndex];
    // 更新所有平面的 blend operation
    for (const node of gridNodes)
    {
        const mat = (node.components![0] as { material: TextureMaterial }).material;
        const matLogic = logic(mat);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rp = matLogic.renderPipeline as any;
        const blend = rp.fragment.targets[0].blend;
        blend.color.operation = currentEquation;
        blend.alpha.operation = currentEquation;
    }
    updateInfo();
});

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
