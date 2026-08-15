import { registerLogic } from '@feng3d/reactivity';
import type { BindingResource, BufferBinding, RenderPipeline } from '@feng3d/webgpu';

/**
 * 材质（纯数据接口，虚类）。
 *
 * 不允许直接使用 Material 作为材质数据（无具体着色器）。具体材质（ColorMaterial /
 * StandardMaterial 等）继承本接口，在 {@link __type__} 字段标识自身。
 *
 * uniforms / renderPipeline / sampler / textureView 绑定全部由各子类自行声明与处理，
 * 基类不预设任何数据字段或渲染逻辑。
 *
 * 具体子类通过 `declare module './Material'` 注册到 {@link MaterialMap} 以纳入
 * {@link Materials} 联合类型。
 */
export interface Material
{
    /** 数据类型标识，对应  工厂注册名（具体子类如 'ColorMaterial'） */
    readonly __type__: string;

    /** 材质名称（缺失时由 registerLogic 自动填充） */
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

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Material: MaterialLogic;
    }
}

declare module '@feng3d/webgpu'
{
    interface BindingResources
    {
        material_uniforms?: BufferBinding;
    }
}

/**
 * MaterialLogic 实例接口（由各子类的 `xxxMaterialLogic` 工厂函数返回）。
 *
 * 通过 `logic(material)` 获取实例（registerLogic 注册了对应工厂）。
 *
 * 暴露 renderPipeline / material_uniforms / bindingResources 供 Renderable 读取写入
 * RenderObject，不直接操作 RenderObject（与 GeometryLogic 的 vertices/indices/draw 模式一致）。
 */

/**
 * Material 逻辑类（基类兜底实现）。
 *
 * 暴露 renderPipeline / material_uniforms / bindingResources 供 Renderable 读取写入
 * RenderObject，不直接操作 RenderObject（与 GeometryLogic 的 vertices/indices/draw 模式一致）。
 *
 * 子类（ColorMaterialLogic / StandardMaterialLogic 等）继承后覆写各 getter。
 * 基类注册 'Material' 字符串，便于 logic(plainMaterial) 不报错。
 */
export class MaterialLogic
{
    /** 关联的材质数据（raw，子类可读；可选以兼容未迁移的字面量子类） */
    protected readonly _data?: Material;

    protected constructor(data: Material)
    {
        this._data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: Material): MaterialLogic
    {
        return new MaterialLogic(data);
    }

    /** 渲染管线（子类覆写；基类兜底为 null） */
    get renderPipeline(): RenderPipeline
    {
        return null as unknown as RenderPipeline;
    }

    /** 材质 uniforms 绑定（子类覆写） */
    get material_uniforms(): BufferBinding
    {
        return { value: {} };
    }

    /** 额外绑定资源（纹理/sampler 等，key 为 binding name；子类覆写） */
    get bindingResources(): Record<string, BindingResource>
    {
        return {};
    }

    /** 是否加载完成（子类可返回依赖纹理的 getter） */
    get isLoaded(): boolean
    {
        return true;
    }

    /** 已加载完成或者加载完成时立即调用 */
    onLoadCompleted(callback: () => void): void
    {
        callback();
    }
}

registerLogic('Material', MaterialLogic as unknown as new (data: Material) => MaterialLogic);
