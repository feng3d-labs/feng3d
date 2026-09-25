import { WebGPU } from '@feng3d/webgpu';
import {
    createTextureFromUrl, logic, Object3D,
    reactive, Scene, TextureMaterial, View, ticker,
} from 'feng3d';

/**
 * 各向异性过滤（Anisotropic Filtering）对比。
 *
 * 对照 three.js：examples/webgl_materials_texture_anisotropy.html
 *
 * 原示例用分屏（scissor test）渲染两个场景，对比同一张 crate 纹理在
 * maxAnisotropy（最大）vs anisotropy=1（无各向异性）下的清晰度差异。
 *
 * feng3d 适配：View 是单视口渲染不支持 scissor 分屏，改为并排两个倾斜平面，
 * 左侧 maxAnisotropy=16（清晰）、右侧 maxAnisotropy=1（模糊），同一视角下
 * 通过对比远处纹素的清晰度展示各向异性过滤的效果。
 */

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const webgpu = await new WebGPU().init();

// crate 纹理（木箱）
const crateTexture = await createTextureFromUrl('/crate.gif');

// 高各向异性采样器（远处纹素清晰）
const highAnisoSampler = {
    addressModeU: 'repeat' as const,
    addressModeV: 'repeat' as const,
    magFilter: 'linear' as const,
    minFilter: 'linear' as const,
    mipmapFilter: 'linear' as const,
    maxAnisotropy: 16,
};

// 无各向异性采样器（远处纹素模糊）
const noAnisoSampler = {
    addressModeU: 'repeat' as const,
    addressModeV: 'repeat' as const,
    magFilter: 'linear' as const,
    minFilter: 'linear' as const,
    mipmapFilter: 'linear' as const,
    maxAnisotropy: 1,
};

// 共享纹理的两个材质（仅 sampler 不同）
function makeMaterial(sampler: typeof highAnisoSampler): TextureMaterial
{
    return {
        __type__: 'TextureMaterial',
        uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
        s_texture: crateTexture as unknown as TextureMaterial['s_texture'],
        sampler,
    };
}

const view: View = {
    __type__: 'View',
    canvas: webgpuCanvas,
    root: {
        __type__: 'Object3D',
        name: 'Untitled',
        components: [{
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.95, g: 0.97, b: 1, a: 1 },
            ambientColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        }],
        children: [
            {
                __type__: 'Object3D', name: 'Main Camera', position: { x: 0, y: 8, z: 20 },
                rotation: { x: 0, y: 0, z: 0 },
                components: [
                    {
                        __type__: 'PerspectiveCamera', fov: 35,
                        aspect: webgpuCanvas.width / webgpuCanvas.height, near: 1, far: 25000,
                    },
                    { __type__: 'OrbitControls', target: { x: 0, y: 0, z: -40 } },
                ],
            },
            // 左侧平面：高各向异性（远处清晰）
            {
                __type__: 'Object3D', name: 'highAniso',
                position: { x: -50, y: 0, z: -40 },
                rotation: { x: -Math.PI / 2 + 0.4, y: 0, z: 0 },
                scale: { x: 100, y: 200, z: 1 },
                components: [{
                    __type__: 'MeshRenderer',
                    // scaleU/V=100 让 crate 纹理重复 100 次（远处密集，各向异性差异明显）
                    geometry: { __type__: 'PlaneGeometry', width: 1, height: 1, segmentsW: 1, segmentsH: 1, scaleU: 100, scaleV: 100 },
                    material: makeMaterial(highAnisoSampler),
                }],
            },
            // 右侧平面：无各向异性（远处模糊）
            {
                __type__: 'Object3D', name: 'noAniso',
                position: { x: 50, y: 0, z: -40 },
                rotation: { x: -Math.PI / 2 + 0.4, y: 0, z: 0 },
                scale: { x: 100, y: 200, z: 1 },
                components: [{
                    __type__: 'MeshRenderer',
                    geometry: { __type__: 'PlaneGeometry', width: 1, height: 1, segmentsW: 1, segmentsH: 1, scaleU: 100, scaleV: 100 },
                    material: makeMaterial(noAnisoSampler),
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
