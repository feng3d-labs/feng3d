import { Sampler, TextureView, BindingResources, BufferBinding, RenderObject, RenderPipeline } from '@feng3d/webgpu';
import { reactive, logic, registerLogic } from '@feng3d/reactivity';
import type { ColorMaterial, createColorMaterial } from './ColorMaterial';
import { StandardMaterial, createStandardMaterial } from './StandardMaterial';
import type { PointMaterial } from './PointMaterial';
import { SegmentMaterial, createSegmentMaterial  } from './SegmentMaterial';
import type { TextureMaterial } from './TextureMaterial';
import type { SkyBoxMaterial } from './SkyBoxMaterial';
import { colorFragmentWGSL } from '../shaders/color.fragment.wgsl';
import { colorVertexWGSL } from '../shaders/color.vertex.wgsl';
import { standardFragmentWGSL } from '../shaders/standard.fragment.wgsl';
import { standardVertexWGSL } from '../shaders/standard.vertex.wgsl';
import { pointFragmentWGSL } from '../shaders/point.fragment.wgsl';
import { pointVertexWGSL } from '../shaders/point.vertex.wgsl';
import { segmentFragmentWGSL } from '../shaders/segment.fragment.wgsl';
import { segmentVertexWGSL } from '../shaders/segment.vertex.wgsl';
import { textureFragmentWGSL } from '../shaders/texture.fragment.wgsl';
import { textureVertexWGSL } from '../shaders/texture.vertex.wgsl';
import { skyboxFragmentWGSL } from '../shaders/skybox.fragment.wgsl';
import { skyboxVertexWGSL } from '../shaders/skybox.vertex.wgsl';
import { buildSampler, buildTextureView } from '../render/webgpu/MaterialPipeline';

/**
 * 材质（纯数据接口，虚类）。
 *
 * 不允许直接使用 Material 作为材质数据（无具体着色器）。具体材质（ColorMaterial /
 * StandardMaterial 等）继承本接口，在 {@link __type__} 字段标识自身，由对应
 * {@link } 工厂在创建时填充 renderPipeline（WGSL 着色器 + 渲染状态）。
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
    /** 数据类型标识，对应  工厂注册名（具体子类如 'ColorMaterial'） */
    readonly __type__: string;

    /**
     * uniform 数据（缺失时由 registerLogic 自动填充）。
     *
     * 子类以强类型对象声明本材质的 uniform 字段，materialLogic 的 beforeRender 会自动
     * 将其写入 `bindingResources.material_uniforms`（对应 WGSL `var<uniform> material_uniforms`）。
     */
    readonly uniforms?: object;

    /**
     * 采样器绑定（缺失时由 registerLogic 自动填充）。
     *
     * 键为 WGSL 中 `sampler` 变量名，值为 webgpu `Sampler`。
     * materialLogic 的 beforeRender 会自动将其合并到 `bindingResources`。
     */
    readonly samplers?: { [key: string]: Sampler };

    /**
     * 纹理视图绑定（缺失时由 registerLogic 自动填充）。
     *
     * 键为 WGSL 中 `texture_*` 变量名，值为 webgpu `TextureView`。
     * materialLogic 的 beforeRender 会自动将其合并到 `bindingResources`。
     */
    readonly textureViews?: { [key: string]: TextureView };

    /**
     * 外部纹理绑定（用于视频纹理，缺失时由 registerLogic 自动填充）。
     *
     * 键为 WGSL 变量名，值为 `GPUExternalTexture`。
     * materialLogic 的 beforeRender 会自动将其合并到 `bindingResources`。
     */
    readonly externalTextures?: { [key: string]: GPUExternalTexture };

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
 * Material 逻辑处理输出。
 *
 * 数据（uniforms / samplers / textureViews / externalTextures）保留在 Material 接口上，
 * 行为（renderPipeline / beforeRender / isLoaded / onLoadCompleted）由本 logic 提供。
 * 子类（ColorMaterialLogic / StandardMaterialLogic 等）继承本类后在构造函数中填充 renderPipeline。
 */
export class MaterialLogic
{
    /** 关联的材质数据 */
    protected readonly _material: Material;
    /** 渲染管线（shader + 渲染状态，子类 logic 在创建时填充） */
    readonly renderPipeline: RenderPipeline;
    /** 是否加载完成（子类可通过 Object.defineProperty 覆盖为依赖纹理的 getter） */
    isLoaded: boolean;
    /** 渲染前把 pipeline/bindingResources/material_uniforms 等写入 renderObject */
    beforeRender: (renderObject: RenderObject) => void;

    constructor(material: Material)
    {
        this._material = material;
        this.renderPipeline = reactive({
            vertex: {},
            fragment: { targets: [{}] },
            primitive: { topology: 'triangle-list', cullFace: 'back', frontFace: 'cw' },
            depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
        });
        this.isLoaded = true;
        this.beforeRender = (renderObject: RenderObject): void =>
        {
            // 通过 reactive 代理赋值，使 runPipeline 中对 r_renderObject.pipeline 的依赖读取
            // 能感知到 pipeline 变化；同时也借 Reactive<T> 顶层去 readonly 让 pipeline 可写。
            const r_renderObject = reactive(renderObject);

            // 渲染管线（shader + 渲染状态，子类 logic 在创建时填充）
            r_renderObject.pipeline = this.renderPipeline;

            const r_ro = reactive(renderObject);
            if (!renderObject.bindingResources)
            {
                r_ro.bindingResources = {} as BindingResources;
            }

            const bindingResources = renderObject.bindingResources;
            const r_bindingResources = reactive(bindingResources);

            // uniforms → material_uniforms（WGSL var<uniform> material_uniforms）
            if (!bindingResources.material_uniforms)
            {
                r_bindingResources.material_uniforms = { value: {} };
            }
            reactive(renderObject.bindingResources.material_uniforms as BufferBinding).value = material.uniforms;

            // samplers / textureViews / externalTextures → 合并到 bindingResources（键与 WGSL 变量名一致）
            Object.assign(r_bindingResources, material.samplers, material.textureViews, material.externalTextures);
        };
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

// ---- 基类 logic 工厂 ----



// ---- 各子类 logic ----

/**
 * ColorMaterial logic：填入 color 着色器。
 */
export class ColorMaterialLogic extends MaterialLogic
{
    constructor(material: ColorMaterial)
    {
        super(material);
        reactive(this.renderPipeline.vertex).wgsl = colorVertexWGSL;
        reactive(this.renderPipeline.fragment).wgsl = colorFragmentWGSL;
    }
}

/**
 * StandardMaterial logic：填入 standard 着色器，监听 5 个纹理变化重算绑定。
 */
export class StandardMaterialLogic extends MaterialLogic
{
    constructor(material: StandardMaterial)
    {
        super(material);

        // standard 着色器配置（一层替换，保留 reactive 可写性）
        const r_pipeline = reactive(this.renderPipeline);
        r_pipeline.vertex = { wgsl: standardVertexWGSL };
        r_pipeline.fragment = { wgsl: standardFragmentWGSL, targets: [{}] };
        r_pipeline.primitive = { topology: 'triangle-list', cullFace: 'back', frontFace: 'cw' };
        r_pipeline.depthStencil = { depthWriteEnabled: true, depthCompare: 'less' };

        const updateTexture = (key: string) =>
        {
            const texture = (material as any)[key];
            material.textureViews[key] = buildTextureView(texture);
            material.samplers[`${key}Sampler`] = buildSampler(texture);
        };

        // 初始化与响应式更新纹理绑定（监听 5 个纹理字段变化）
        const keys = ['s_diffuse', 's_normal', 's_specular', 's_ambient', 's_envMap'];
        for (const key of keys)
        {
            reactiveEffect(() => updateTexture(key));
        }
    }

    get isLoaded()
    {
        const material = this._material as StandardMaterial;

        return [material.s_diffuse, material.s_normal, material.s_specular, material.s_ambient, material.s_envMap].every(t => t.isLoaded);
    }

    onLoadCompleted(callback: () => void): void
    {
        const material = this._material as StandardMaterial;
        const list = [material.s_diffuse, material.s_normal, material.s_specular, material.s_ambient, material.s_envMap];
        let loadingNum = 0;
        for (const texture of list)
        {
            if (!texture.isLoaded)
            {
                loadingNum++;
                texture.on('loadCompleted', () =>
                {
                    loadingNum--;
                    if (loadingNum === 0) callback();
                });
            }
        }
        if (loadingNum === 0) callback();
    }
}

/**
 * PointMaterial logic：填入 point 着色器，point-list 拓扑、不剔除。
 */
export class PointMaterialLogic extends MaterialLogic
{
    constructor(material: PointMaterial)
    {
        super(material);
        reactive(this.renderPipeline.vertex).wgsl = pointVertexWGSL;
        reactive(this.renderPipeline.fragment).wgsl = pointFragmentWGSL;
        reactive(this.renderPipeline.primitive).topology = 'point-list';
        reactive(this.renderPipeline.primitive).cullFace = 'none';
    }
}

/**
 * SegmentMaterial logic：填入 segment 着色器，line-list 拓扑、不剔除、开启 alpha 混合。
 */
export class SegmentMaterialLogic extends MaterialLogic
{
    constructor(material: SegmentMaterial)
    {
        super(material);
        reactive(this.renderPipeline.vertex).wgsl = segmentVertexWGSL;
        reactive(this.renderPipeline.fragment).wgsl = segmentFragmentWGSL;
        reactive(this.renderPipeline.primitive).topology = 'line-list';
        reactive(this.renderPipeline.primitive).cullFace = 'none';
        // 开启 alpha 混合
        reactive(this.renderPipeline.fragment).targets = [{
            blend: {
                color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                alpha: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            },
        }];
    }
}

/**
 * TextureMaterial logic：填入 texture 着色器，监听 s_texture 变化重算绑定。
 */
export class TextureMaterialLogic extends MaterialLogic
{
    constructor(material: TextureMaterial)
    {
        super(material);
        reactive(this.renderPipeline.vertex).wgsl = textureVertexWGSL;
        reactive(this.renderPipeline.fragment).wgsl = textureFragmentWGSL;
        reactive(this.renderPipeline.primitive).topology = 'triangle-list';
        reactive(this.renderPipeline.primitive).cullFace = 'back';
        reactive(this.renderPipeline.primitive).frontFace = 'cw';
        reactive(this.renderPipeline.depthStencil).depthWriteEnabled = true;
        reactive(this.renderPipeline.depthStencil).depthCompare = 'less';

        const updateTexture = () =>
        {
            material.textureViews.s_texture = buildTextureView(material.s_texture);
            material.samplers.s_textureSampler = buildSampler(material.s_texture);
        };
        reactiveEffect(updateTexture);
    }

    get isLoaded() { return (this._material as TextureMaterial).s_texture.isLoaded; }

    onLoadCompleted(callback: () => void): void
    {
        const texture = (this._material as TextureMaterial).s_texture;
        if (texture.isLoaded) { callback(); return; }
        texture.on('loadCompleted', callback);
    }
}

/**
 * SkyBoxMaterial logic：填入 skybox 着色器，不剔除、关闭深度写入、深度比较 less-equal。
 */
export class SkyBoxMaterialLogic extends MaterialLogic
{
    constructor(material: SkyBoxMaterial)
    {
        super(material);
        reactive(this.renderPipeline.vertex).wgsl = skyboxVertexWGSL;
        reactive(this.renderPipeline.fragment).wgsl = skyboxFragmentWGSL;
        reactive(this.renderPipeline.primitive).cullFace = 'none';
        reactive(this.renderPipeline.depthStencil).depthWriteEnabled = false;
        reactive(this.renderPipeline.depthStencil).depthCompare = 'less-equal';

        const updateTexture = () =>
        {
            material.textureViews.s_skyboxTexture = buildTextureView(material.s_skyboxTexture);
            material.samplers.s_skyboxTextureSampler = buildSampler(material.s_skyboxTexture);
        };
        reactiveEffect(updateTexture);
    }

    get isLoaded() { return (this._material as SkyBoxMaterial).s_skyboxTexture.isLoaded; }

    onLoadCompleted(callback: () => void): void
    {
        const texture = (this._material as SkyBoxMaterial).s_skyboxTexture;
        if (texture.isLoaded) { callback(); return; }
        texture.on('loadCompleted', callback);
    }
}

// ---- 注册到 logic 分发表 ----

registerLogic('Material', MaterialLogic);
registerLogic('ColorMaterial', ColorMaterialLogic);
registerLogic('StandardMaterial', StandardMaterialLogic);
registerLogic('PointMaterial', PointMaterialLogic);
registerLogic('SegmentMaterial', SegmentMaterialLogic);
registerLogic('TextureMaterial', TextureMaterialLogic);
registerLogic('SkyBoxMaterial', SkyBoxMaterialLogic);

// ---- 注册默认材质（惰性创建，避免 import 期触发 effect/纹理加载） ----

let _defaultsRegistered = false;
function ensureDefaultMaterials(): void
{
    if (_defaultsRegistered) return;
    _defaultsRegistered = true;
    setDefaultMaterial('Default-Material', createStandardMaterial());
    setDefaultMaterial('Segment-Material', createSegmentMaterial());
    // Water-Material 暂用 StandardMaterial 占位（仓库无 water.wgsl 着色器）
    setDefaultMaterial('Water-Material', createStandardMaterial());
}

// ---- 内部：响应式 effect 工具（隔离对 @feng3d/reactivity effect 的依赖差异） ----

import { effect } from '@feng3d/reactivity';
function reactiveEffect(fn: () => void): void
{
    effect(fn);
}
