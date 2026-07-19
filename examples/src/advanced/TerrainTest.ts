import { reactive, ticker, View, createTextureFromUrl, logic } from 'feng3d';
import { WebGPU } from '@feng3d/webgpu';

let light1Position: { readonly x: number; readonly y: number; readonly z: number; };

const root = '/terrain/';

function createHeightMap()
{
    // createTextureFromUrl 返回 Promise<Texture>，赋值前数据已就绪
    return createTextureFromUrl(root + 'terrain_heights.jpg');
}

async function createTerrainMaterial()
{
    const s_diffuse = await createTextureFromUrl(root + 'terrain_diffuse.jpg');
    const s_normal = await createTextureFromUrl(root + 'terrain_normals.jpg');

    // generateMipmap/minFilter 等采样配置已上移到 material.samplers（统一为 webgpu Sampler）。
    // 原 TextureMinFilter.LINEAR_MIPMAP_LINEAR 等价于 mipmapFilter:'linear' + minFilter:'linear'，
    // defaultSampler 已经满足该配置，这里无需额外设置。
    const s_blendTexture = await createTextureFromUrl(root + 'terrain_splats.png');
    const s_splatTexture1 = await createTextureFromUrl(root + 'beach.jpg');
    const s_splatTexture2 = await createTextureFromUrl(root + 'grass.jpg');
    const s_splatTexture3 = await createTextureFromUrl(root + 'rock.jpg');

    return {
        __type__: 'TerrainMaterial' as const,
        uniforms: {
            u_splatRepeats: { __type__: 'Color4', r: 1, g: 50, b: 50, a: 50 },
        },
        s_diffuse,
        s_blendTexture,
        s_splatTexture1,
        s_splatTexture2,
        s_splatTexture3,
    } as any;
}

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 先 await 所有纹理加载（createTextureFromUrl 是 Promise 工厂），再构造 View
const heightMap = await createHeightMap();
const terrainMaterial = await createTerrainMaterial();

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.408, g: 0.38, b: 0.357, a: 1.0 },
            ambientColor: { __type__: 'Color4', r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
        }],
        children: [{
            __type__: 'Object3D',
            name: 'Main Camera',
            position: { x: 0, y: 80, z: 0 },
            components: [{
                __type__: 'Camera',
            }, {
                __type__: 'FPSController',
            }],
        }, {
            __type__: 'Object3D',
            name: 'terrain',
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'TerrainGeometry', width: 500, height: 100, depth: 500, segmentsW: 100, segmentsH: 100, heightMap } as any,
                material: terrainMaterial,
            }],
        }, {
            __type__: 'Object3D',
            name: 'light1',
            position: light1Position = { x: 0, y: 1000, z: 0 },
            components: [{
                __type__: 'PointLight',
                range: 5000,
                color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
            }],
        }],
    },
};
const viewLogic = logic(view);

// 光源旋转动画
ticker.onframe(() =>
{
    const time = Date.now();
    const angle = time / 1000 / 5;
    reactive(light1Position).y = Math.sin(angle) * 1000;
    reactive(light1Position).z = Math.cos(angle) * 1000;
});

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
