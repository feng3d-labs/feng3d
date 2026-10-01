import { WebGPU } from '@feng3d/webgpu';
import { createTextureFromUrl, logic, reactive, ticker, type View } from 'feng3d';
// 显式导入 terrain 包（副作用导入）：触发 TerrainGeometry / TerrainMaterial 的 registerLogic 注册。
// feng3d 的 index 不 re-export 上层扩展包（避免依赖环，见 feng3d/src/index.ts 注释）。
import '@feng3d/terrain';
import type { TerrainGeometry, TerrainMaterial } from '@feng3d/terrain';

/**
 * 地形多层纹理合并（splat 混合）示例。
 *
 * 对照旧版写法：TerrainMergeMethod 组合「权重图 + 若干层 splat 贴图」，在渲染前把
 * blendTexture / splatMergeTexture / splatRepeats 写进 renderObject.uniforms。
 * 现在该能力已并入 TerrainMaterial（s_blendTexture + s_splatTexture1/2/3 + u_splatRepeats），
 * 不再需要单独的 TerrainMergeMethod 类。
 *
 * 混合规则（见 packages/terrain/src/TerrainMaterial.ts 的 terrainMethod）：
 *   color = lerp(diffuse, splat1, blend.r)
 *   color = lerp(color,   splat2, blend.g)
 *   color = lerp(color,   splat3, blend.b)     // blend = texture(s_blendTexture, uv)
 */

const root = '/terrain/';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// 先 await 所有纹理加载（createTextureFromUrl 是 Promise 工厂），再构造 View
const heightMap = await createTextureFromUrl(root + 'terrain_heights.jpg');

const terrainMaterial: TerrainMaterial = {
    __type__: 'TerrainMaterial',
    uniforms: {
        // splat 各层 UV 重复次数：g/b/a 分别对应 splat1/2/3（r 未用）
        u_splatRepeats: { __type__: 'Color4', r: 1, g: 50, b: 50, a: 50 },
    },
    // 基础漫反射贴图（与各 splat 层混合）
    s_diffuse: await createTextureFromUrl(root + 'terrain_diffuse.jpg'),
    // 权重图：RGB 通道分别是 splat1/2/3 的权重
    s_blendTexture: await createTextureFromUrl(root + 'terrain_splats.png'),
    // 三个 splat 层（合并到地表的三种地表材质）
    s_splatTexture1: await createTextureFromUrl(root + 'beach.jpg'),
    s_splatTexture2: await createTextureFromUrl(root + 'grass.jpg'),
    s_splatTexture3: await createTextureFromUrl(root + 'rock.jpg'),
};

let light1Position: { readonly x: number; readonly y: number; readonly z: number };

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
                __type__: 'PerspectiveCamera',
            }, {
                __type__: 'FPSController',
            }],
        }, {
            __type__: 'Object3D',
            name: 'terrain',
            components: [{
                __type__: 'MeshRenderer',
                geometry: {
                    __type__: 'TerrainGeometry',
                    width: 500,
                    height: 100,
                    depth: 500,
                    segmentsW: 100,
                    segmentsH: 100,
                    maxElevation: 255,
                    minElevation: 0,
                    heightMap,
                } as TerrainGeometry,
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
    const angle = Date.now() / 1000 / 5;
    reactive(light1Position).y = Math.sin(angle) * 1000;
    reactive(light1Position).z = Math.cos(angle) * 1000;
});

ticker.onframe(() => { webgpu.submit(viewLogic.submit); });
