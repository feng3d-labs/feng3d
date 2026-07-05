import { Sampler, TextureView } from '@feng3d/webgpu';

/**
 * 材质（纯数据接口，虚类）。
 *
 * 不允许直接使用 Material 作为材质数据（无具体着色器）。具体材质（ColorMaterial /
 * StandardMaterial 等）继承本接口，在 {@link __type__} 字段标识自身，由对应
 * {@link materialLogic} 工厂在创建时填充 renderPipeline（WGSL 着色器 + 渲染状态）。
 *
 * 数据字段（uniforms / samplers / textureViews / externalTextures）保留在本接口上；
 * 行为（renderPipeline / beforeRender / isLoaded / onLoadCompleted）由 materialLogic 提供。
 *
 * 具体子类通过 `declare module './Material'` 注册到 {@link MaterialMap} 以纳入
 * {@link Materials} 联合类型。
 *
 * shader 在 materialLogic 创建时固定，不支持运行时切换。
 */
export interface Material
{
    /** 数据类型标识，对应 materialLogic 工厂注册名（具体子类如 'ColorMaterial'） */
    readonly __type__: string;

    /**
     * uniform 数据（缺失时由 registerDefaults 自动填充）。
     *
     * 子类以强类型对象声明本材质的 uniform 字段，materialLogic 的 beforeRender 会自动
     * 将其写入 `bindingResources.material_uniforms`（对应 WGSL `var<uniform> material_uniforms`）。
     */
    readonly uniforms?: object;

    /**
     * 采样器绑定（缺失时由 registerDefaults 自动填充）。
     *
     * 键为 WGSL 中 `sampler` 变量名，值为 webgpu `Sampler`。
     * materialLogic 的 beforeRender 会自动将其合并到 `bindingResources`。
     */
    readonly samplers?: { [key: string]: Sampler };

    /**
     * 纹理视图绑定（缺失时由 registerDefaults 自动填充）。
     *
     * 键为 WGSL 中 `texture_*` 变量名，值为 webgpu `TextureView`。
     * materialLogic 的 beforeRender 会自动将其合并到 `bindingResources`。
     */
    readonly textureViews?: { [key: string]: TextureView };

    /**
     * 外部纹理绑定（用于视频纹理，缺失时由 registerDefaults 自动填充）。
     *
     * 键为 WGSL 变量名，值为 `GPUExternalTexture`。
     * materialLogic 的 beforeRender 会自动将其合并到 `bindingResources`。
     */
    readonly externalTextures?: { [key: string]: GPUExternalTexture };

    /** 材质名称（缺失时由 registerDefaults 自动填充） */
    name?: string;
}

/**
 * Material 类型注册表，由各子类通过 `declare module './Material'` 扩展。
 */
export interface MaterialMap { }

/**
 * 所有 Material 具体子类型的联合类型（含基类 Material 兜底）。
 *
 * 用于 Renderable.material 等字段，使 TS 可按 `__type__` 识别具体子类型，
 * 同时允许基类 Material（如 getDefaultMaterial 返回值）赋值。
 */
export type Materials = MaterialMap[keyof MaterialMap] | Material;
