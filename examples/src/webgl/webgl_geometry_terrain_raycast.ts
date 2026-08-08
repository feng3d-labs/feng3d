import { WebGPU } from '@feng3d/webgpu';
import {
    ConeGeometry, createTextureFromCanvas, CustomGeometry, logic, Object3D,
    reactive, raycaster, Ray3, Scene, StandardMaterial, TextureMaterial,
    ticker, View, Vector3,
} from 'feng3d';
import { ImprovedNoise } from '@feng3d/addons';

/**
 * Perlin 噪声地形 + 鼠标射线拾取。
 *
 * 对照 three.js：examples/webgl_geometry_terrain_raycast.html
 *
 * 原示例：ImprovedNoise 生成 256×256 高度图写入 PlaneGeometry 顶点 y，
 * CanvasTexture 烘焙光照生成地形纹理，鼠标移动时 Raycaster 命中地形，
 * 把 ConeGeometry helper 摆到命中点并朝法线方向。
 *
 * feng3d 适配：
 * - ImprovedNoise（addons/math）→ 直接复用
 * - PlaneGeometry rotateX + 顶点位移 → CustomGeometry 手动构建（positions 直接写世界坐标）
 * - CanvasTexture → createTextureFromCanvas
 * - Raycaster.intersectObject → raycaster.pick(ray, [terrainNode])
 * - helper.lookAt(normal) → reactive(helper).rotation 矩阵 lookAt
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// ---- 参数（对应原示例） ----
const WORLD_W = 256;
const WORLD_D = 256;
const MESH_W = 100;          // 世界宽度
const MESH_D = 100;          // 世界深度
const HEIGHT_SCALE = 4;      // 高度放大系数（对应原示例 quality*1.75 累加后的视觉缩放）

// ---- 1. 生成高度图（ImprovedNoise，4 层叠加） ----
function generateHeight(w: number, h: number): Uint8Array
{
    const size = w * h;
    const data = new Uint8Array(size);
    const perlin = new ImprovedNoise();
    const z = Math.random() * 100;
    let quality = 1;

    for (let j = 0; j < 4; j++)
    {
        for (let i = 0; i < size; i++)
        {
            const x = i % w;
            const y = ~~(i / w);
            data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);
        }
        quality *= 5;
    }

    return data;
}

// ---- 2. 烘焙光照纹理（CanvasTexture） ----
function generateTexture(data: Uint8Array, w: number, h: number): HTMLCanvasElement
{
    const sun = new Vector3(1, 1, 1);
    sun.normalize();

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    const image = ctx.getImageData(0, 0, w, h);
    const imageData = image.data;

    for (let i = 0, j = 0; i < imageData.length; i += 4, j++)
    {
        // 由高度差近似法线
        const nx = (data[j - 2] ?? data[j]) - (data[j + 2] ?? data[j]);
        const nz = (data[j - w * 2] ?? data[j]) - (data[j + w * 2] ?? data[j]);
        const ny = 2;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        const shade = (nx * sun.x + ny * sun.y + nz * sun.z) / len;

        imageData[i] = (96 + shade * 128) * (0.5 + data[j] * 0.007);
        imageData[i + 1] = (32 + shade * 96) * (0.5 + data[j] * 0.007);
        imageData[i + 2] = (shade * 96) * (0.5 + data[j] * 0.007);
        imageData[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);

    // 4× 放大 + 随机噪点（对应原示例 canvasScaled）
    const scaled = document.createElement('canvas');
    scaled.width = w * 4;
    scaled.height = h * 4;
    const sctx = scaled.getContext('2d')!;
    sctx.scale(4, 4);
    sctx.drawImage(canvas, 0, 0);
    const sImage = sctx.getImageData(0, 0, scaled.width, scaled.height);
    const sData = sImage.data;
    for (let i = 0; i < sData.length; i += 4)
    {
        const v = ~~(Math.random() * 5);
        sData[i] += v;
        sData[i + 1] += v;
        sData[i + 2] += v;
    }
    sctx.putImageData(sImage, 0, 0);

    return scaled;
}

// ---- 3. 生成地形几何体（CustomGeometry，手动写 positions/normals/uvs/indices） ----
const heightData = generateHeight(WORLD_W, WORLD_D);
const terrainCanvas = generateTexture(heightData, WORLD_W, WORLD_D);
const terrainTexture = createTextureFromCanvas(terrainCanvas);

function buildTerrainGeometry(): CustomGeometry
{
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // 顶点：(x, y=height, z)，世界范围 [-MESH_W/2, MESH_W/2] × [-MESH_D/2, MESH_D/2]
    for (let iz = 0; iz < WORLD_D; iz++)
    {
        for (let ix = 0; ix < WORLD_W; ix++)
        {
            const hIdx = iz * WORLD_W + ix;
            const y = (heightData[hIdx] / 255) * HEIGHT_SCALE * 8;
            const x = (ix / (WORLD_W - 1) - 0.5) * MESH_W;
            const z = (iz / (WORLD_D - 1) - 0.5) * MESH_D;
            positions.push(x, y, z);
            uvs.push(ix / (WORLD_W - 1), iz / (WORLD_D - 1));
        }
    }

    // 索引（双三角形面片）
    for (let iz = 0; iz < WORLD_D - 1; iz++)
    {
        for (let ix = 0; ix < WORLD_W - 1; ix++)
        {
            const a = iz * WORLD_W + ix;
            const b = a + 1;
            const c = a + WORLD_W;
            const d = c + 1;
            indices.push(a, c, b);
            indices.push(b, c, d);
        }
    }

    const geo: CustomGeometry = { __type__: 'CustomGeometry' };
    // 顶点数据通过响应式数据接口写入（logic 字段只读）
    const r = reactive(geo);
    r.positions = positions;
    r.uvs = uvs;
    r.indices = indices;
    r.normals = new Array(positions.length).fill(0);
    // colors 占位（CustomGeometry 需要）
    const vCount = positions.length / 3;
    const colors: number[] = [];
    for (let i = 0; i < vCount; i++) colors.push(1, 1, 1, 1);
    r.colors = colors;

    return geo;
}

const terrainGeo = buildTerrainGeometry();

// ---- 4. 地形节点 + 拾取 helper ----
let terrainRot: { readonly x: number; readonly y: number; readonly z: number };
const terrainNode: Object3D = {
    __type__: 'Object3D',
    name: 'terrain',
    rotation: terrainRot = { x: 0, y: 0, z: 0 },
    components: [{
        __type__: 'MeshRenderer',
        geometry: terrainGeo,
        material: {
            __type__: 'TextureMaterial',
            uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
            s_texture: terrainTexture as unknown as TextureMaterial['s_texture'],
        },
    }],
};

// 拾取指示锥（对应原示例 geometryHelper = ConeGeometry(20, 100, 3)）
let helperRot: { x: number; y: number; z: number };
const helperNode: Object3D = {
    __type__: 'Object3D',
    name: 'picker',
    position: { x: 0, y: 0, z: 0 },
    rotation: helperRot = { x: 0, y: 0, z: 0 },
    components: [{
        __type__: 'MeshRenderer',
        geometry: { __type__: 'ConeGeometry', bottomRadius: 0.8, topRadius: 0, height: 4, segmentsW: 3 } as ConeGeometry,
        material: {
            __type__: 'StandardMaterial',
            uniforms: {
                u_diffuse: { __type__: 'Color4', r: 1, g: 0.6, b: 0, a: 1 },
                u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
                u_glossiness: 0, u_reflectivity: 0,
            },
        },
    }],
};

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.1, g: 0.1, b: 0.1, a: 1 },
            ambientColor: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera',
                position: { x: 0, y: 60, z: 80 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [
                    {
                        __type__: 'PerspectiveCamera', fov: 50,
                        aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 1000,
                    },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: 0 }, autoRotate: true, autoRotateSpeed: 0.5 },
                ],
            },
            {
                __type__: 'Object3D', name: 'dirLight', position: { x: 1, y: 1, z: 1 },
                components: [{
                    __type__: 'DirectionalLight',
                    color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                    intensity: 1,
                }],
            },
            terrainNode,
            helperNode,
        ],
    },
};

const viewLogic = logic(view);

// ---- 5. 鼠标射线拾取（对应原示例 onPointerMove + raycaster） ----
const camera = view.root!.children![0].components![0] as unknown as { __type__: string };
let lastRayTime = 0;

function updatePicker()
{
    const now = performance.now();
    if (now - lastRayTime < 50) return; // 节流
    lastRayTime = now;

    const camLogic = logic(camera);
    const gx = mouseX / webgpuCanvas.clientWidth;
    const gy = mouseY / webgpuCanvas.clientHeight;
    const ray = camLogic.getRay3D?.(gx, gy) as Ray3 | undefined;
    if (!ray) return;

    const hit = raycaster.pick(ray, [terrainNode]);
    if (hit && hit.localPosition)
    {
        // 地形在原点无变换，localPosition ≈ worldPosition
        const p = hit.localPosition;
        reactive(helperNode).position = { x: p.x, y: p.y + 2, z: p.z };
    }
}

let mouseX = 0;
let mouseY = 0;
webgpuCanvas.addEventListener('pointermove', (e: PointerEvent) =>
{
    const rect = webgpuCanvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

ticker.onframe(() =>
{
    updatePicker();
    webgpu.submit(viewLogic.submit);
});
