import { WebGPU } from '@feng3d/webgpu';
import { Vector3 } from '@feng3d/math';
import { CustomGeometry, FogMode, logic, Object3D, reactive, Scene, StandardMaterial, TextureMaterial, View } from 'feng3d';

/**
 * 移植自 three.js examples/webgl_geometry_terrain.html。
 *
 * 原示例：Perlin 噪声（ImprovedNoise）生成 256×256 高度图，PlaneGeometry(7500,7500,255,255)
 * 旋转 -π/2 后顶点 Y 设为高度×10；CanvasTexture 根据高度图 + 法线光照生成地形纹理（绿褐山峦）；
 * MeshBasicMaterial 无光照；FogExp2(0xefd1b5, 0.0025) 背景雾；FirstPersonControls 漫游。
 *
 * feng3d 适配：
 * - ImprovedNoise：纯数学算法，内联（Perlin 改进噪声，与 three.js ImprovedNoise.js 完全一致）。
 * - 顶点高度：feng3d PlaneGeometry 是纯数据不支持外部改顶点，改用 CustomGeometry 手动构建带高度的
 *   平面网格（positions/normals/uvs/indices）。
 * - CanvasTexture：webgpu Texture 直接喂 HTMLCanvasElement 源（generateTexture 生成的地形纹理）。
 * - MeshBasicMaterial → TextureMaterial（无光照，采样地形纹理）。
 * - FogExp2(0xefd1b5, 0.0025)：TextureMaterial 走独立着色器不支持雾，改用 StandardMaterial +
 *   u_fogMode=exp2/u_fogColor/u_fogDensity（库已实现雾，但 StandardMaterial 有光照会让纹理偏暗；
 *   为对齐 MeshBasicMaterial 无光照效果，本示例用 TextureMaterial 接受无雾的折中——地形主体可见，
 *   仅远景无雾淡入）。
 * - FirstPersonControls：feng3d 无等价控件，用鼠标缓动相机替代（旋转视角俯瞰地形）。
 * - setAnimationLoop → requestAnimationFrame。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- ImprovedNoise（Perlin 改进噪声，移植自 three.js ImprovedNoise.js） ----
const PERM = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10,
    23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87,
    174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211,
    133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208,
    89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5,
    202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119,
    248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232,
    178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249,
    14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205,
    93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
for (let i = 0; i < 256; i++) PERM[256 + i] = PERM[i];

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function grad(hash: number, x: number, y: number, z: number): number
{
    const h = hash & 15;
    const u = h < 8 ? x : y, v = h < 4 ? y : h === 12 || h === 14 ? x : z;

    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}
function noise(x: number, y: number, z: number): number
{
    const floorX = Math.floor(x), floorY = Math.floor(y), floorZ = Math.floor(z);
    const X = floorX & 255, Y = floorY & 255, Z = floorZ & 255;
    x -= floorX; y -= floorY; z -= floorZ;
    const xm1 = x - 1, ym1 = y - 1, zm1 = z - 1;
    const u = fade(x), v = fade(y), w = fade(z);
    const A = PERM[X] + Y, AA = PERM[A] + Z, AB = PERM[A + 1] + Z, B = PERM[X + 1] + Y, BA = PERM[B] + Z, BB = PERM[B + 1] + Z;

    return lerp(
        lerp(
            lerp(grad(PERM[AA], x, y, z), grad(PERM[BA], xm1, y, z), u),
            lerp(grad(PERM[AB], x, ym1, z), grad(PERM[BB], xm1, ym1, z), u),
            v),
        lerp(
            lerp(grad(PERM[AA + 1], x, y, zm1), grad(PERM[BA + 1], xm1, y, zm1), u),
            lerp(grad(PERM[AB + 1], x, ym1, zm1), grad(PERM[BB + 1], xm1, ym1, zm1), u),
            v),
        w);
}

// ---- 生成高度图（对应原示例 generateHeight） ----
const WORLD_W = 256, WORLD_D = 256;
function generateHeight(width: number, height: number): Uint8Array
{
    // 固定随机种子（对应原示例 Math.random 覆盖）
    let seed = Math.PI / 4;
    const rand = () => { const x = Math.sin(seed++) * 10000; return x - Math.floor(x); };

    const size = width * height, data = new Uint8Array(size);
    const z = rand() * 100;
    let quality = 1;
    for (let j = 0; j < 4; j++)
    {
        for (let i = 0; i < size; i++)
        {
            const x = i % width, y = ~~(i / width);
            data[i] += Math.abs(noise(x / quality, y / quality, z) * quality * 1.75);
        }
        quality *= 5;
    }

    return data;
}

// ---- 生成地形纹理（对应原示例 generateTexture：法线光照 + 高度着色 + 噪点） ----
function generateTexture(data: Uint8Array, width: number, height: number): HTMLCanvasElement
{
    const sun = new Vector3(1, 1, 1).normalize();
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    const image = ctx.getImageData(0, 0, width, height);
    const id = image.data;
    const v = new Vector3();
    for (let i = 0, j = 0; i < id.length; i += 4, j++)
    {
        v.x = data[j - 2] - data[j + 2];
        v.y = 2;
        v.z = data[j - width * 2] - data[j + width * 2];
        v.normalize();
        const shade = v.dot(sun);
        id[i] = (96 + shade * 128) * (0.5 + data[j] * 0.007);
        id[i + 1] = (32 + shade * 96) * (0.5 + data[j] * 0.007);
        id[i + 2] = (shade * 96) * (0.5 + data[j] * 0.007);
        id[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);

    // 放大 4×（对应原示例 canvasScaled）
    const scaled = document.createElement('canvas');
    scaled.width = width * 4; scaled.height = height * 4;
    const sctx = scaled.getContext('2d')!;
    sctx.scale(4, 4);
    sctx.drawImage(canvas, 0, 0);
    const sImage = sctx.getImageData(0, 0, scaled.width, scaled.height);
    const sId = sImage.data;
    for (let i = 0; i < sId.length; i += 4)
    {
        const n = ~~(Math.random() * 5);
        sId[i] += n; sId[i + 1] += n; sId[i + 2] += n;
    }
    sctx.putImageData(sImage, 0, 0);

    return scaled;
}

// ---- 构建地形几何体（PlaneGeometry 旋转 -π/2 + 顶点高度，改用 CustomGeometry） ----
const heightData = generateHeight(WORLD_W, WORLD_D);
const PLANE_SIZE = 7500;
const terrainTexture = generateTexture(heightData, WORLD_W, WORLD_D);

function buildTerrainGeometry(): CustomGeometry
{
    const segW = WORLD_W - 1, segD = WORLD_D - 1;
    const positions: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    // 平面铺在 xz 平面（旋转 -π/2 后），y 为高度。沿 x/z 从 -PLANE_SIZE/2 到 +PLANE_SIZE/2
    for (let iz = 0; iz <= segD; iz++)
    {
        for (let ix = 0; ix <= segW; ix++)
        {
            const px = (ix / segW - 0.5) * PLANE_SIZE;
            const pz = (iz / segD - 0.5) * PLANE_SIZE;
            const hIdx = iz * WORLD_W + ix;
            const py = heightData[hIdx] * 10;
            positions.push(px, py, pz);
            uvs.push(ix / segW, iz / segD);
            colors.push(1, 1, 1, 1);
        }
    }
    for (let iz = 0; iz < segD; iz++)
    {
        for (let ix = 0; ix < segW; ix++)
        {
            const a = iz * (segW + 1) + ix;
            const b = a + segW + 1;
            indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
    }
    const geo: CustomGeometry = { __type__: 'CustomGeometry' };
    const gl = logic(geo);
    gl.positions = positions;
    gl.uvs = uvs;
    gl.colors = colors;
    gl.normals = []; // TextureMaterial 不用法线，留空由 buildVertices 补默认
    (gl as unknown as { indices: number[] }).indices = indices;

    return geo;
}

const terrainGeometry = buildTerrainGeometry();

const fogColor = { __type__: 'Color4' as const, r: 0.937, g: 0.819, b: 0.710, a: 1 }; // 0xefd1b5

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            // Scene.background = 0xefd1b5（暖沙色）
            background: fogColor,
        }],
        children: [
            // 相机：PerspectiveCamera(60, aspect, 1, 10000)，position(100,800,-800) lookAt(-100,810,-800)
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                position: { x: 100, y: 800, z: -800 },
                components: [{
                    __type__: 'PerspectiveCamera',
                    fov: 60,
                    aspect: webgpuCanvas.width / webgpuCanvas.height,
                    near: 1,
                    far: 10000,
                }],
            },
            // 地形 mesh：TextureMaterial + 地形 CanvasTexture
            {
                __type__: 'Object3D',
                name: 'terrain',
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: terrainGeometry,
                    material: {
                        __type__: 'TextureMaterial',
                        uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
                        s_texture: {
                            descriptor: { size: [WORLD_W * 4, WORLD_D * 4] as [number, number], format: 'rgba8unorm' as const },
                            sources: [{ image: terrainTexture }],
                        } as unknown as TextureMaterial['s_texture'],
                    },
                }],
            },
        ],
    },
};

const viewLogic = logic(view);
const cameraObj = view.root!.children![0];
const lookTarget = new Vector3(-100, 810, -800);

// ---- 鼠标缓动相机（替代 FirstPersonControls，旋转视角） ----
let targetX = 100; let targetZ = -800;
window.addEventListener('mousemove', (event) =>
{
    // 鼠标水平移动 → 相机绕地形中心环绕
    const mx = (event.clientX / window.innerWidth - 0.5) * 2; // -1..1
    const angle = mx * Math.PI * 0.3;
    const radius = 900;
    targetX = Math.sin(angle) * radius;
    targetZ = -Math.cos(angle) * radius - 200;
});

void FogMode; // 引用避免未使用告警（fog 占位）

function animate(): void
{
    const cur = logic(cameraObj).position;
    const nx = cur.x + (targetX - cur.x) * 0.05;
    const nz = cur.z + (targetZ - cur.z) * 0.05;
    reactive(cameraObj).position = { x: nx, y: 800, z: nz };
    logic(cameraObj).lookAt(lookTarget);

    webgpu.submit(viewLogic.submit);
    requestAnimationFrame(animate);
}

// 初始 lookAt
logic(cameraObj).lookAt(lookTarget);
requestAnimationFrame(animate);
