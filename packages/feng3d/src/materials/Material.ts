import { registerLogic } from '@feng3d/reactivity';
import { reactive, UnReadonly } from '@feng3d/reactivity';
import type { BindingResource, BufferBinding, RenderObject, RenderPipeline } from '@feng3d/webgpu';
import { BindingResources } from '@feng3d/webgpu';

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
 * Material 逻辑类（基类兜底实现）。
 *
 * 渲染数据不对外暴露（renderPipeline / material_uniforms / 纹理绑定为子类内部状态），
 * 由 {@link beforeRender} 写入 RenderObject（与 Object3DLogic.beforeRender 同模式，
 * 在 Renderable 的 renderObject computed 内调用，经响应式读取建立依赖，数据变化
 * 自动失效重算）。对外仅暴露语义化查询（isTransparent / isLoaded）。
 *
 * 子类（ColorMaterialLogic / StandardMaterialLogic 等）继承后覆写 beforeRender
 * 与查询 getter。基类注册 'Material' 字符串，便于 logic(plainMaterial) 不报错。
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

    /** 是否半透明（blend 启用，供渲染排序/分组/阴影目标筛选查询；不暴露管线细节） */
    get isTransparent(): boolean
    {
        return false;
    }

    /** 是否面片拓扑（triangle 系；point/line 系拓扑不参与阴影等面片处理） */
    get isPrimitivesTopology(): boolean
    {
        return true;
    }

    /** 是否加载完成（子类可返回依赖纹理的响应式 getter） */
    get isLoaded(): boolean
    {
        return true;
    }

    /**
     * 渲染前写入渲染数据（pipeline / material_uniforms / 纹理绑定到 renderObject）。
     *
     * 在 Renderable 的 renderObject computed 内调用——内部经响应式代理读取材质
     * 数据建立依赖，材质/uniform/纹理变化时 computed 自动失效，beforeRender 重跑。
     * material_uniforms 为 per renderObject 稳定引用（首帧创建后仅更新 .value）。
     */
    beforeRender(renderObject: RenderObject): void
    {
        // 基类兜底：只确保 bindingResources 存在，不写入渲染数据
        const r_renderObject = reactive(renderObject);
        if (!renderObject.bindingResources) r_renderObject.bindingResources = {} as BindingResources;
    }
}

/**
 * 材质 beforeRender 的公共辅助：写入 pipeline 与 material_uniforms（稳定引用模式）。
 *
 * 供各子类 class 复用（组合表达 has-a），避免逐个重复样板。
 */
export function writeMaterialBase(renderObject: RenderObject, pipeline: RenderPipeline, uniformsValue: () => unknown): void
{
    const r_renderObject = reactive(renderObject);
    if (!renderObject.bindingResources) r_renderObject.bindingResources = {} as BindingResources;
    const bindingResources = renderObject.bindingResources;

    (renderObject as UnReadonly<RenderObject>).pipeline = pipeline;
    bindingResources.material_uniforms ||= { value: uniformsValue() };
    reactive(bindingResources.material_uniforms).value = uniformsValue();
}

/**
 * 材质 beforeRender 的公共辅助：拷贝纹理绑定（key → binding）。
 */
export function writeTextureBindings(renderObject: RenderObject, bindings: Record<string, BindingResource>): void
{
    if (!renderObject.bindingResources) return;
    const r_bindingResources = reactive(renderObject.bindingResources);

    for (const key in bindings)
    {
        r_bindingResources[key] = bindings[key];
    }
}

registerLogic('Material', MaterialLogic as unknown as new (data: Material) => MaterialLogic);
