import { WebGPU } from '@feng3d/webgpu';
import {
    CustomGeometry, createTextureFromCanvas, logic, MeshRenderer, Object3D,
    reactive, Scene, StandardMaterial, View, ticker,
} from 'feng3d';
import { ImprovedNoise } from '@feng3d/addons';

/**
 * 查找表（LUT）顶点着色（热力图）。
 *
 * 对照 three.js：examples/webgl_geometry_colors_lookuptable.html
 *
 * 原示例：BufferGeometryLoader 加载带 pressure 属性的 JSON 模型，用 Lut 类
 * 将 pressure → 彩色（rainbow/cooltowarm/blackbody），写入顶点色 attribute，
 * MeshLambertMaterial{vertexColors} 渲染，角落 Sprite 画图例条。
 *
 * feng3d 适配：
 * - pressure.json（three.js 专有格式）→ 用 ImprovedNoise 生成程序化标量场写入 CustomGeometry 顶点色
 * - Lut 配色 → 自写 rainbow 渐变函数（HSL 映射）
 * - MeshLambertMaterial{vertexColors} → StandardMaterial（已确认使用顶点色 a_color）
 * - 图例条 → CanvasTexture 画在右上角小平面（简化）
 * - 按钮/radio 切换配色方案
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- LUT 颜色映射函数 ----
// 值域 [0,1] → RGB（对应 three.js Lut.setColorMap 的各种配色方案）

/** 彩虹配色（rainbow） */
function lutRainbow(t: number): [number, number, number]
{
    // t∈[0,1] → HSL hue ∈ [0.66, 0]（蓝→红反向）
    const h = (1 - t) * 0.66;

    return hslToRgb(h, 1, 0.5);
}

/** 冷暖配色（cooltowarm） */
function lutCoolToWarm(t: number): [number, number, number]
{
    // 蓝(0.23,0.3,0.75) → 白(0.87,0.87,0.87) → 红(0.71,0.02,0.15)
    if (t < 0.5)
    {
        const k = t * 2;

        return [0.23 + (0.87 - 0.23) * k, 0.3 + (0.87 - 0.3) * k, 0.75 + (0.87 - 0.75) * k];
    }
    const k = (t - 0.5) * 2;

    return [0.87 + (0.71 - 0.87) * k, 0.87 + (0.02 - 0.87) * k, 0.87 + (0.15 - 0.87) * k];
}

/** 灰度配色（grayscale） */
function lutGrayscale(t: number): [number, number, number]
{
    return [t, t, t];
}

const LUTS: Record<string, (t: number) => [number, number, number]> = {
    rainbow: lutRainbow,
    cooltowarm: lutCoolToWarm,
    grayscale: lutGrayscale,
};
let currentLut = 'rainbow';

function hslToRgb(h: number, s: number, l: number): [number, number, number]
{
    const hue2rgb = (p: number, q: number, t: number) =>
    {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;

        return p;
    };
    if (s === 0) return [l, l, l];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

// ---- 生成程序化标量场（Perlin 噪声，替代 pressure.json） ----
const SEG = 64;
const SIZE = 200;
const perlin = new ImprovedNoise();

function buildGeometry(lutFn: (t: number) => [number, number, number]): CustomGeometry
{
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const colors: number[] = [];
    const normals: number[] = [];

    // 平面顶点（yUp 朝上，y 由 Perlin 噪声决定）
    for (let iz = 0; iz <= SEG; iz++)
    {
        for (let ix = 0; ix <= SEG; ix++)
        {
            const u = ix / SEG;
            const v = iz / SEG;
            const x = (u - 0.5) * SIZE;
            const z = (v - 0.5) * SIZE;
            // 标量场值 = Perlin 噪声（映射到 [0,1]）
            const field = (perlin.noise(u * 4, v * 4, 0) + 1) * 0.5;
            const y = field * 40;
            positions.push(x, y, z);
            uvs.push(u, v);

            // 顶点色 = LUT(field)
            const [r, g, b] = lutFn(field);
            colors.push(r, g, b, 1);
            normals.push(0, 1, 0);
        }
    }

    for (let iz = 0; iz < SEG; iz++)
    {
        for (let ix = 0; ix < SEG; ix++)
        {
            const a = iz * (SEG + 1) + ix;
            const b = a + 1;
            const c = a + (SEG + 1);
            const d = c + 1;
            indices.push(a, c, b);
            indices.push(b, c, d);
        }
    }

    const geo: CustomGeometry = { __type__: 'CustomGeometry' };
    const gl = logic(geo);
    gl.positions = positions;
    gl.uvs = uvs;
    gl.normals = normals;
    gl.colors = colors;
    (gl as unknown as { indices: number[] }).indices = indices;

    return geo;
}

// ---- 图例条（CanvasTexture） ----
function buildLegendCanvas(lutFn: (t: number) => [number, number, number]): HTMLCanvasElement
{
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    for (let y = 0; y < 128; y++)
    {
        const t = 1 - y / 127;
        const [r, g, b] = lutFn(t);
        ctx.fillStyle = `rgb(${r * 255 | 0},${g * 255 | 0},${b * 255 | 0})`;
        ctx.fillRect(0, y, 16, 1);
    }

    return canvas;
}

let terrainGeo = buildGeometry(LUTS[currentLut]);
const legendTexture = createTextureFromCanvas(buildLegendCanvas(LUTS[currentLut]));

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.7, g: 0.7, b: 0.7, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 150, y: 150, z: 200 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [
                    {
                        __type__: 'PerspectiveCamera', fov: 45,
                        aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 2000,
                    },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 } },
                ],
            },
            {
                __type__: 'Object3D', name: 'dirLight', position: { x: 0.5, y: 1, z: 0.3 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 1,
                }],
            },
            // LUT 着色的地形
            {
                __type__: 'Object3D', name: 'terrain',
                rotation: { x: 0, y: 0, z: 0 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: terrainGeo,
                    material: {
                        __type__: 'StandardMaterial',
                        uniforms: {
                            u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
                            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                            u_glossiness: 0, u_reflectivity: 0,
                        },
                    },
                }],
            },
        ],
    },
};

const viewLogic = logic(view);

// ---- 按钮切换配色方案 ----
const infoEl = document.getElementById('info');
function updateInfo()
{
    if (infoEl) infoEl.textContent = `LUT 顶点着色热力图（当前: ${currentLut}）| 点击按钮切换配色 | OrbitControls`;
}
updateInfo();

const btnLut = document.getElementById('btnLut');
btnLut?.addEventListener('click', () =>
{
    const keys = Object.keys(LUTS);
    currentLut = keys[(keys.indexOf(currentLut) + 1) % keys.length];
    // 重建几何体（新的顶点色）
    const newGeo = buildGeometry(LUTS[currentLut]);
    const terrainNode = view.root!.children!.find(c => c.name === 'terrain')!;
    reactive(terrainNode.components![0] as MeshRenderer).geometry = newGeo;
    terrainGeo = newGeo;
    // 更新图例（createTextureFromCanvas 同步返回 Texture）
    Object.assign(legendTexture, createTextureFromCanvas(buildLegendCanvas(LUTS[currentLut])));
    updateInfo();
});

ticker.onframe(() =>
{
    webgpu.submit(viewLogic.submit);
});
