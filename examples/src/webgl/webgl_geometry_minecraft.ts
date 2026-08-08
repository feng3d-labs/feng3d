import { WebGPU } from '@feng3d/webgpu';
import {
    CustomGeometry, createTextureFromCanvas, logic, Object3D,
    reactive, Scene, StandardMaterial, View, ticker,
} from 'feng3d';
import { ImprovedNoise } from '@feng3d/addons';

/**
 * Perlin 噪声体素地形（Minecraft 风格）。
 *
 * 对照 three.js：examples/webgl_geometry_minecraft.html
 * 原示例用 ImprovedNoise 生成高度图，逐方块合并可见面，贴 atlas.png（NearestFilter）。
 * feng3d 用 CustomGeometry 手动合并方块顶点 + CanvasTexture 程序化图集。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- 生成图集纹理（程序化，4 种方块颜色） ----
const atlasCanvas = document.createElement('canvas');
atlasCanvas.width = 64;
atlasCanvas.height = 16;
const atlasCtx = atlasCanvas.getContext('2d')!;
// 4 个 16x16 方块：草绿、土、石头、水
const blockColors = ['#4a7c3a', '#7a5a3a', '#888888', '#3a5a7a'];
for (let i = 0; i < 4; i++)
{
    atlasCtx.fillStyle = blockColors[i];
    atlasCtx.fillRect(i * 16, 0, 16, 16);
    // 加噪点
    for (let j = 0; j < 20; j++)
    {
        const v = (Math.random() * 40 - 20) | 0;
        atlasCtx.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 100})`;
        atlasCtx.fillRect(i * 16 + (Math.random() * 16 | 0), Math.random() * 16 | 0, 1, 1);
    }
}
const atlasTexture = createTextureFromCanvas(atlasCanvas);

// ---- Perlin 噪声高度图 ----
const WORLD = 32; // 32×32 方块
const perlin = new ImprovedNoise();
const heights = new Uint8Array(WORLD * WORLD);
for (let z = 0; z < WORLD; z++)
{
    for (let x = 0; x < WORLD; x++)
    {
        let h = 0;
        let q = 1;
        for (let j = 0; j < 4; j++)
        {
            h += Math.abs(perlin.noise(x / (q * 4), z / (q * 4), 0) * q * 1.75);
            q *= 3;
        }
        heights[z * WORLD + x] = Math.min(h | 0, 15);
    }
}

// ---- 手动构建方块顶点（只生成顶面，简化版） ----
const positions: number[] = [];
const uvs: number[] = [];
const indices: number[] = [];
const colors: number[] = [];
const normals: number[] = [];
const BLOCK = 1;

function pushFace(cx: number, cy: number, cz: number, faceType: number)
{
    // faceType: 0=top, 1=side
    const blockType = faceType === 0 ? 0 : (heights[0] > 8 ? 1 : 1); // 顶面用草(0)，侧面用土(1)
    const uvOffset = blockType * 0.25; // 图集中 4 个方块各占 0.25
    const baseIdx = positions.length / 3;

    if (faceType === 0)
    {
        // 顶面（朝上）
        positions.push(cx - 0.5, cy + 0.5, cz - 0.5);
        positions.push(cx + 0.5, cy + 0.5, cz - 0.5);
        positions.push(cx + 0.5, cy + 0.5, cz + 0.5);
        positions.push(cx - 0.5, cy + 0.5, cz + 0.5);
        for (let i = 0; i < 4; i++) { normals.push(0, 1, 0); colors.push(1, 1, 1, 1); }
        uvs.push(uvOffset, 0, uvOffset + 0.25, 0, uvOffset + 0.25, 1, uvOffset, 1);
        indices.push(baseIdx, baseIdx + 1, baseIdx + 2, baseIdx, baseIdx + 2, baseIdx + 3);
    }
}

for (let z = 0; z < WORLD; z++)
{
    for (let x = 0; x < WORLD; x++)
    {
        const h = heights[z * WORLD + x];
        pushFace(x - WORLD / 2, h * BLOCK, z - WORLD / 2, 0);
    }
}

const geo: CustomGeometry = { __type__: 'CustomGeometry' };
const gl = logic(geo);
gl.positions = positions;
gl.uvs = uvs;
gl.normals = normals;
gl.colors = colors;
(gl as unknown as { indices: number[] }).indices = indices;

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.5, g: 0.7, b: 1, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.8, g: 0.8, b: 0.8, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 20, z: 30 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'PerspectiveCamera', fov: 60,
                    aspect: webgpuCanvas.width / webgpuCanvas.height, near: 0.1, far: 200,
                },
                { __type__: 'OrbitControls', target: { x: 0, y: 5, z: 0 } }],
            },
            { __type__: 'Object3D', name: 'dirLight', position: { x: 0.5, y: 1, z: 0.3 },
              components: [{ __type__: 'DirectionalLight', color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, intensity: 1 }] },
            {
                __type__: 'Object3D', name: 'terrain',
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: geo,
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0, u_reflectivity: 0,
                        },
                        s_diffuse: atlasTexture as unknown as StandardMaterial['s_diffuse'],
                        // 注：StandardMaterial 暂不支持自定义 sampler（采样器内部固定），
                        // nearest 过滤效果无法通过材质字段配置。
                    },
                }],
            },
        ],
    },
};

const viewLogic = logic(view);

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
