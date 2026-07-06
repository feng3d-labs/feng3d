import type { Color4 } from '../core/Color4';
import { Material } from './Material';
import { registerDefaults } from '../core/logic';

// 触发 materialLogic 注册（ColorMaterial 工厂 + 默认材质）
import './materialLogic';

declare module './Material'
{
    export interface MaterialMap
    {
        ColorMaterial: ColorMaterial;
    }
}

/**
 * ColorMaterial uniforms（漫反射颜色）。
 */
export interface ColorUniforms
{
    /**
     * 漫反射颜色（纯数据 Color4）。
     *
     * 修改任一分量（如 `reactive(mat.uniforms.u_diffuseInput).r = 0.5`）
     * 会被响应式系统捕获，实时更新到 GPU。
     */
    readonly u_diffuseInput: Color4;
}

/**
 * 颜色材质（纯数据接口）。
 *
 * 使用 color 着色器（顶点颜色 × 漫反射颜色）。shader 与渲染状态由 materialLogic 在
 * 创建时填充到 renderPipeline。漫反射颜色直接作为 uniforms.u_diffuseInput。
 */
export interface ColorMaterial extends Material
{
    readonly __type__: 'ColorMaterial';
    readonly uniforms: ColorUniforms;
}

/**
 * 创建 ColorMaterial 实例。
 */
export function createColorMaterial(): ColorMaterial
{
    return {
        __type__: 'ColorMaterial',
        name: '',
        uniforms: { u_diffuseInput: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
        samplers: {},
        textureViews: {},
        externalTextures: {},
    };
}

// 注册默认值（缺失字段自动填充）
// uniforms 为纯数据 Color4 字面量，applyDefaults 浅拷贝（{...}）后各实例独立。
registerDefaults('ColorMaterial', {
    name: '',
    uniforms: { u_diffuseInput: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
    samplers: {},
    textureViews: {},
    externalTextures: {},
});

