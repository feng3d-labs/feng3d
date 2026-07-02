import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass, gPartial } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import { RenderMode } from '../render/data/enums';
import { RenderParams } from '../render/data/RenderParams';
import { serialization, serialize } from '@feng3d/serialization';
import { AssetData } from '../core/AssetData';
import { Feng3dObject } from '../core/Feng3dObject';
import { HideFlags } from '../core/HideFlags';
import { BindingResources, RenderObject, RenderPipeline } from '@feng3d/webgpu';

declare global
{
    interface MixinsDefaultMaterial
    {

    }
}

/**
 * 材质（虚类）。
 *
 * 不允许直接 `new Material()`（构造为 protected）。具体材质继承本类，在构造时
 * 填充 {@link renderPipeline}（WGSL 着色器源码 + 渲染状态），并在 `beforeRender`
 * 中把自身 uniform/纹理字段写入 `renderObject.bindingResources`（支持响应式更新）。
 *
 * shader 在构造时固定，不支持运行时切换。
 */
@decoratorRegisterClass()
export class Material extends Feng3dObject
{
    __class__: 'Material';

    //
    protected renderObject = new RenderObject();

    @oav({ component: 'OAVFeng3dPreView' })
    protected preview = '';

    /**
     * 渲染管线。
     *
     * 直接使用 `@feng3d/webgpu` 的 {@link RenderPipeline}（字段在接口中为 `readonly`，
     * 属编译期约束，运行时可写）。子类在构造时填充 vertex/fragment/primitive/depthStencil
     * 等字段（对应 WGSL 着色器源码与渲染状态）。
     */
    readonly renderPipeline: RenderPipeline;

    @oav()
    @serialize
    name = '';

    /**
     * 渲染参数
     */
    @serialize
    @oav({ block: '渲染参数', component: 'OAVObjectView' })
    renderParams: RenderParams;

    /**
     * 构造函数。
     *
     * Material 为虚类，不允许直接实例化（`new Material()` 会抛错）。
     * 具体材质继承本类并在构造时填充 {@link renderPipeline}（shader 与渲染状态）。
     */
    constructor()
    {
        super();
        if (new.target === Material)
        {
            throw new Error('Material 为虚类，不能直接实例化，请使用具体子类（如 ColorMaterial / StandardMaterial）');
        }
        // 初始化完整的子对象结构（空值），子类构造时填充具体 shader 与渲染状态。
        // RenderPipeline 接口字段为 readonly（编译期约束），这里用字面量初始化需断言。
        this.renderPipeline = {
            vertex: {},
            fragment: { targets: [{}] },
            primitive: {},
            depthStencil: {},
        } as RenderPipeline;
        this.renderParams = new RenderParams();
    }

    /**
     * uniform 数据（兼容字段）。
     *
     * 仅用于尚未重构为子类的材质（通过工厂创建 uniforms）。
     * 新材质应直接声明强类型字段并在 beforeRender 中写入 bindingResources。
     */
    uniforms: { [key: string]: any } = {};

    beforeRender(renderObject: RenderObject)
    {
        // 通过 reactive 代理赋值，使 runPipeline 中对 r_renderObject.pipeline 的依赖读取
        // 能感知到 pipeline 变化；同时也借 Reactive<T> 顶层去 readonly 让 pipeline 可写。
        const r_renderObject = reactive(renderObject);

        // 渲染管线（shader + 渲染状态，子类在构造时填充）
        r_renderObject.pipeline = this.renderPipeline;

        const r_ro = reactive(renderObject);
        if (!renderObject.bindingResources)
        {
            r_ro.bindingResources = {} as BindingResources;
        }

        const bindingResources = renderObject.bindingResources;
        const r_bindingResources = reactive(bindingResources);

        if (!bindingResources.material_uniforms)
        {
            r_bindingResources.material_uniforms = { value: {} };
        }

        // 材质相关绑定资源由子类负责（写入 bindingResources，支持响应式更新）。
        // WebGL 兼容字段
        Object.assign(renderObject.uniforms ||= {}, this.renderObject.uniforms);
        renderObject.renderParams = this.renderParams;
        renderObject.shaderMacro ||= {};
        renderObject.shaderMacro.IS_POINTS_MODE = this.renderParams.renderMode === RenderMode.POINTS;
    }

    /**
     * 是否加载完成（子类按需覆盖，检查自身纹理字段）
     */
    get isLoaded()
    {
        return true;
    }

    /**
     * 已加载完成或者加载完成时立即调用
     * @param callback 完成回调
     */
    onLoadCompleted(callback: () => void)
    {
        callback();
    }

    /**
     * 设置默认材质
     *
     * @param name 材质名称
     * @param material 材质实例
     */
    static setDefault<K extends keyof DefaultMaterial>(name: K, material: Material)
    {
        serialization.setValue(material, { name, hideFlags: HideFlags.NotEditable });
        this._defaultMaterials[<any>name] = material;
        AssetData.addAssetData(name, material);
    }

    /**
     * 获取材质
     *
     * @param name 材质名称
     */
    static getDefault<K extends keyof DefaultMaterial>(name: K)
    {
        return this._defaultMaterials[name];
    }
    private static _defaultMaterials: DefaultMaterial = <any>{};
}

/**
 * 默认材质
 */
export interface DefaultMaterial extends MixinsDefaultMaterial
{

}
