import { registerLogic } from '@feng3d/reactivity';
import type { RenderObject, RenderPipeline } from '@feng3d/webgpu';

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
 * MaterialLogic 实例接口（由各子类的 `xxxMaterialLogic` 工厂函数返回）。
 *
 * 通过 `logic(material)` 获取实例（registerLogic 注册了对应工厂）。
 *
 * 子类工厂（colorMaterialLogic / standardMaterialLogic 等）：
 * - 在闭包中创建 renderPipeline（reactive 渲染管线状态）
 * - 实现 beforeRender（写入 pipeline + material_uniforms + sampler/textureView 绑定 +
 *   初始化 bindingResources）
 * - 通过返回对象暴露 isLoaded / onLoadCompleted / beforeRender / renderPipeline
 */
export interface MaterialLogic
{
    /** 渲染管线（含 wgsl/primitive/depthStencil/blend 等状态） */
    get renderPipeline(): RenderPipeline;
    /** 是否加载完成（子类可返回依赖纹理的 getter） */
    get isLoaded(): boolean;
    /** 已加载完成或者加载完成时立即调用 */
    onLoadCompleted(callback: () => void): void;
    /** 渲染前写入 pipeline + bindingResources */
    beforeRender(renderObject: RenderObject): void;
}

/**
 * 基类 MaterialLogic 工厂（兜底实现，不写入任何状态）。
 *
 * 子类（ColorMaterial / StandardMaterial 等）会覆盖具体 __type__ 的工厂；
 * 此处仅注册基类 'Material' 字符串，便于 `logic(plainMaterial)` 不报错。
 */
function materialLogic(material: Material): MaterialLogic
{
    return {
        get renderPipeline() { return null as unknown as RenderPipeline; },
        get isLoaded() { return true; },
        onLoadCompleted: (callback) => callback(),
        beforeRender: () => { },
    };
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
// 仅注册基类；各子类（colorMaterialLogic / standardMaterialLogic 等）已移至各自数据文件，
// 由其本文件 import MaterialLogic 后在加载时调用 registerLogic 注册自身工厂。

registerLogic('Material', materialLogic);

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
