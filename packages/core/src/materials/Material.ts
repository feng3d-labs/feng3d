import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass, gPartial } from '@feng3d/polyfill';
import { RenderMode } from '../render/data/enums';
import { RenderParams } from '../render/data/RenderParams';
import { serialization, serialize } from '@feng3d/serialization';
import { AssetData } from '../core/AssetData';
import { Feng3dObject } from '../core/Feng3dObject';
import { HideFlags } from '../core/HideFlags';
import { RenderObject } from '@feng3d/webgpu';

declare global
{
    interface MixinsDefaultMaterial
    {

    }
}

/**
 * 可变的 RenderPipeline 视图。
 *
 * `RenderPipeline` 接口的子状态字段声明为 `readonly`，但运行时是普通对象可改。
 * 材质需要在构造时填充/修改这些字段（如 `renderPipeline.vertex.wgsl = ...`），
 * 这里去掉 readonly 供材质直接操作。传给 WebGPU 渲染时仍符合 `RenderPipeline` 结构。
 */
type MutableRenderPipeline = {
    vertex: { wgsl?: string; code?: string; entryPoint?: string };
    fragment: { wgsl?: string; code?: string; entryPoint?: string; targets?: unknown[] };
    primitive: { topology?: string; cullFace?: string; frontFace?: string };
    depthStencil: { depthWriteEnabled?: boolean; depthCompare?: string };
};

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
     * 子类在构造时填充 vertex/fragment/primitive/depthStencil 等字段
     * （对应 WGSL 着色器源码与渲染状态）。
     */
    readonly renderPipeline: MutableRenderPipeline;

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
        // 初始化完整的子对象结构（空值），子类构造时填充具体 shader 与渲染状态
        this.renderPipeline = {
            vertex: {},
            fragment: { targets: [{}] },
            primitive: {},
            depthStencil: {},
        };
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
        const ro = renderObject as any;

        // 渲染管线（shader + 渲染状态，子类在构造时填充）
        ro.pipeline = this.renderPipeline;

        // 材质相关绑定资源由子类负责（写入 bindingResources，支持响应式更新）。
        // WebGL 兼容字段
        Object.assign(ro.uniforms ||= {}, this.renderObject.uniforms);
        ro.renderParams = this.renderParams;
        ro.shaderMacro ||= {};
        ro.shaderMacro.IS_POINTS_MODE = this.renderParams.renderMode === RenderMode.POINTS;
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
