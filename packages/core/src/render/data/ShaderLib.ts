import { RenderParams } from './RenderParams';

/**
 * shader 配置项。
 *
 * 在 WebGPU 路径下，WGSL 源码由 {@link render/webgpu/ShaderRegistry} 管理（按 shaderName），
 * 此处承载每个 shader 的 uniforms 类映射（cls）与默认渲染参数（renderParams）。
 *
 * vertex/fragment 字段保留可选以兼容历史注册代码（各材质仍写入），实际不再用于 GLSL 编译。
 */
export interface ShaderConfigItem
{
    /** uniforms 类（用于实例化该 shader 对应的 uniform 对象）。 */
    cls?: new(...args: any[]) => any;
    /** 默认渲染参数。 */
    renderParams?: Partial<RenderParams>;
    /** 顶点着色器源码（历史兼容，WebGPU 路径下不使用）。 */
    vertex?: string;
    /** 片段着色器源码（历史兼容，WebGPU 路径下不使用）。 */
    fragment?: string;
}

/**
 * shader 配置。
 */
export interface ShaderConfig
{
    /** shader 名称 → 配置项。 */
    shaders: { [shaderName: string]: ShaderConfigItem };
}

/**
 * 全局 shader 配置单例（数据注册表）。
 *
 * 各材质模块在加载时通过 `shaderConfig.shaders[name] = { cls, renderParams }` 注册。
 * WGSL 源码注册在 {@link render/webgpu/ShaderRegistry}。
 */
export const shaderConfig: ShaderConfig = { shaders: {} };

/**
 * 着色器库。
 *
 * 原属 @feng3d/renderer（含 GLSL `#include` 展开、宏变量提取、shader 缓存等），
 * 现精简为纯配置查询。GLSL 相关逻辑已删除。
 */
export class ShaderLib
{
    /** shader 配置。 */
    get shaderConfig()
    {
        this._shaderConfig = this._shaderConfig || shaderConfig;

        return this._shaderConfig;
    }
    set shaderConfig(v)
    {
        this._shaderConfig = v;
    }
    private _shaderConfig: ShaderConfig;

    /** 获取所有 shader 名称。 */
    getShaderNames()
    {
        return Object.keys(this.shaderConfig.shaders);
    }

    /** 清除缓存（WebGPU 路径下为空操作，保留接口兼容）。 */
    clearCache()
    {
        // WebGPU 路径下无 GLSL 编译缓存，空操作。
    }
}

/**
 * shader 库单例。
 */
export const shaderlib = new ShaderLib();
