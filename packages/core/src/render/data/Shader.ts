import { gPartial } from '@feng3d/polyfill';
import { ShaderMacro } from './ShaderMacro';

/**
 * 着色器宏定义（core 内联类型）。
 *
 * 原属 @feng3d/renderer 的 ShaderMacro 接口。在 WebGPU 路径下，宏通过 WGSL
 * `override` 常量（pipeline.vertex.constants）或运行时分支实现，不再用 GLSL `#define`。
 */
export type { ShaderMacro };

/**
 * 着色器引用。
 *
 * 在 WebGPU 渲染路径下，shader 源码由 {@link render/webgpu/ShaderRegistry} 注册的
 * WGSL 提供，按 shaderName 查找。此类仅承载 shaderName 与 shaderMacro，赋值给
 * RenderObject 的 WebGL 兼容字段 `shader`（供遗留路径引用）。
 *
 * 原属 @feng3d/renderer（含 GLSL 编译逻辑 activeShaderProgram/compileShader 等），
 * 现删除全部 GLSL 编译逻辑。
 */
export class Shader
{
    /** shader 名称（与 ShaderRegistry 注册名对应）。 */
    shaderName: string;

    /** shader 宏定义。 */
    shaderMacro: ShaderMacro = {} as any;

    constructor(source?: gPartial<Shader>)
    {
        Object.assign(this, source);
    }
}
