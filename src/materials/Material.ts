import { BindingResources, RenderObject } from '@feng3d/webgpu';
import { reactive, registerLogic } from '@feng3d/reactivity';

// 注意：本文件不静态 import 任何子类材质文件（ColorMaterial/StandardMaterial/...）。
// 子类文件（含 `class XxxLogic extends MaterialLogic`）会反向 import 本文件获取
// MaterialLogic。若本文件再正向 import 子类，会形成 ES module 循环，导致
// `Cannot access 'MaterialLogic' before initialization`（TDZ）。
// 子类的 registerLogic(cls) 由 src/index.ts barrel 统一触发加载执行；
// 默认材质则通过下方 registerDefaultMaterialFactory 由子类注册工厂、惰性创建。

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
        ColorMaterial: MaterialLogic;
        StandardMaterial: MaterialLogic;
        PointMaterial: MaterialLogic;
        SegmentMaterial: MaterialLogic;
        TextureMaterial: MaterialLogic;
        SkyBoxMaterial: MaterialLogic;
    }
}

/**
 * Material 逻辑处理基类。
 *
 * 子类（ColorMaterialLogic / StandardMaterialLogic 等）继承本类后：
 * - 自行声明 uniforms / renderPipeline 字段并在构造器中初始化
 * - override beforeRender 写入 pipeline + material_uniforms + 自身的 sampler/textureView 绑定
 */
export class MaterialLogic
{
    /** 是否加载完成（子类可通过 Object.defineProperty 覆盖为依赖纹理的 getter） */
    get isLoaded(): boolean { return true; }

    /**
     * 渲染前初始化 bindingResources。
     *
     * 基类只确保 bindingResources 存在。子类 override 时调 super 后自行写入
     * pipeline / material_uniforms / sampler / textureView。
     */
    beforeRender(renderObject: RenderObject): void
    {
        if (!renderObject.bindingResources)
        {
            reactive(renderObject).bindingResources = {} as BindingResources;
        }
    }

    /** 已加载完成或者加载完成时立即调用 */
    onLoadCompleted(callback: () => void): void { callback(); }
}
// ---- 默认材质注册表 ----

const _defaultMaterials: Record<string, Material> = {};

/**
 * 设置默认材质。
 *
 * @param name 材质名称
 * @param material 材质实例
 */
export function setDefaultMaterial(name: string, material: Material): void
{
    _defaultMaterials[name] = material;
}

/**
 * 获取默认材质。
 *
 * @param name 材质名称
 */
export function getDefaultMaterial(name: string): Material
{
    ensureDefaultMaterials();
    return _defaultMaterials[name];
}

// ---- 注册到 logic 分发表 ----
// 仅注册基类；各子类（ColorMaterialLogic / StandardMaterialLogic 等）已移至各自数据文件，
// 由其本文件 import MaterialLogic 后在加载时调用 registerLogic 注册自身。

registerLogic('Material', MaterialLogic);

// ---- 注册默认材质（惰性创建，避免 import 期触发 effect/纹理加载） ----
//
// 为避免 ES module 循环（见文件头注释），本文件不 import 子类工厂。各子类文件
// （StandardMaterial/SegmentMaterial 等）在加载时通过 registerDefaultMaterialFactory
// 注册自己的默认材质工厂；ensureDefaultMaterials 在首次取用时调用这些工厂创建实例。

const _defaultMaterialFactories: Record<string, () => Material> = {};

/**
 * 注册默认材质工厂。
 *
 * 子类文件在模块加载时调用，注册「默认材质名 → 创建函数」映射。
 * {@link ensureDefaultMaterials} 在首次取用默认材质时惰性调用这些工厂。
 *
 * @param name 材质名称
 * @param factory 创建该默认材质的工厂函数
 */
export function registerDefaultMaterialFactory(name: string, factory: () => Material): void
{
    _defaultMaterialFactories[name] = factory;
}

let _defaultsRegistered = false;
function ensureDefaultMaterials(): void
{
    if (_defaultsRegistered) return;
    _defaultsRegistered = true;
    for (const name in _defaultMaterialFactories)
    {
        if (!Object.prototype.hasOwnProperty.call(_defaultMaterialFactories, name)) continue;
        setDefaultMaterial(name, _defaultMaterialFactories[name]());
    }
}
