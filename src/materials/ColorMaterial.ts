import { Color4 } from '@feng3d/math';
import { Material } from './Material';
import { registerDefaults } from '../core/logic';

// 触发 materialLogic 注册（ColorMaterial 工厂 + 默认材质）
import './materialLogic';

/**
 * ColorMaterial uniforms（漫反射颜色）。
 */
export interface ColorUniforms
{
    /**
     * 漫反射颜色。
     *
     * 修改该字段（如 `reactive(mat.uniforms).u_diffuseInput = new Color4().fromUnit(...)`）
     * 会被响应式系统捕获，实时更新到 GPU。
     */
    u_diffuseInput: Color4;
}

/**
 * 颜色材质（纯数据接口）。
 *
 * 使用 color 着色器（顶点颜色 × 漫反射颜色）。shader 与渲染状态由 materialLogic 在
 * 创建时填充到 renderPipeline。漫反射颜色直接作为 uniforms.u_diffuseInput。
 */
export interface ColorMaterial extends Material
{
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
        uniforms: { u_diffuseInput: new Color4() },
        samplers: {},
        textureViews: {},
        externalTextures: {},
    };
}

// 注册默认值（缺失字段自动填充）
// 注意：uniforms 字段含 Color4 实例，每次填充会浅拷贝（{...}）但 Color4 引用共享——
// 此处可接受，因为 ColorMaterial 默认 uniforms 不应被 mutate（用户应整体替换 uniforms）。
registerDefaults('ColorMaterial', {
    name: '',
    uniforms: { u_diffuseInput: new Color4() },
    samplers: {},
    textureViews: {},
    externalTextures: {},
});

