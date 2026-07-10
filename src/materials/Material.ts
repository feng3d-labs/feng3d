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
 */
export interface MaterialLogic
{
    /** 渲染管线（shader + 渲染状态，子类 logic 在创建时填充） */
    readonly renderPipeline: RenderPipeline;
    /** 是否加载完成 */
    readonly isLoaded: boolean;
    /** 渲染前把 pipeline/bindingResources/material_uniforms 等写入 renderObject */
    beforeRender(renderObject: RenderObject): void;
    /** 已加载完成或者加载完成时立即调用 */
    onLoadCompleted(callback: () => void): void;
}

/**
 * 获取 Material 的 logic（统一 logic 入口的类型化便捷封装）。
 */
export function materialLogic(material: Material): MaterialLogic
{
    return logic(material);
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

/**
 * 创建 Material 基类 logic。
 *
 * 构造默认 renderPipeline、实现通用 beforeRender（写 pipeline/bindingResources/
 * material_uniforms/合并 samplers/textureViews/externalTextures）、isLoaded=true、
 * onLoadCompleted 立即回调。
 *
 * 子类 logic 工厂应直接调用本函数（不要走 materialLogic()，避免 _pending 递归），
 * 然后填充自身 renderPipeline 字段、覆盖 isLoaded/onLoadCompleted。
 */
export function createBaseMaterialLogic(material: Material): MaterialLogic
{
    const renderPipeline: RenderPipeline = reactive({
        vertex: {},
        fragment: { targets: [{}] },
        primitive: { topology: 'triangle-list', cullFace: 'back', frontFace: 'cw' },
        depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
    });

    function beforeRender(renderObject: RenderObject): void
    {
        // 通过 reactive 代理赋值，使 runPipeline 中对 r_renderObject.pipeline 的依赖读取
        // 能感知到 pipeline 变化；同时也借 Reactive<T> 顶层去 readonly 让 pipeline 可写。
        const r_renderObject = reactive(renderObject);

        // 渲染管线（shader + 渲染状态，子类 logic 在创建时填充）
        r_renderObject.pipeline = renderPipeline;

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
    }

    return {
        renderPipeline,
        isLoaded: true,
        beforeRender,
        onLoadCompleted(callback: () => void) { callback(); },
    };
}

// ---- 各子类 logic 工厂 ----

/**
 * ColorMaterial logic：填入 color 着色器。
 */
function createColorMaterialLogic(material: ColorMaterial): MaterialLogic
{
    const base = createBaseMaterialLogic(material);
    reactive(base.renderPipeline.vertex).wgsl = colorVertexWGSL;
    reactive(base.renderPipeline.fragment).wgsl = colorFragmentWGSL;

    return base;
}

/**
 * StandardMaterial logic：填入 standard 着色器，监听 5 个纹理变化重算绑定。
 */
function createStandardMaterialLogic(material: StandardMaterial): MaterialLogic
{
    const base = createBaseMaterialLogic(material);

    // standard 着色器配置（一层替换，保留 reactive 可写性）
    const r_pipeline = reactive(base.renderPipeline);
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

    const textures = () => [material.s_diffuse, material.s_normal, material.s_specular, material.s_ambient, material.s_envMap];

    return {
        ...base,
        get isLoaded() { return textures().every(t => t.isLoaded); },
        onLoadCompleted(callback: () => void)
        {
            const list = textures();
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
        },
    };
}

/**
 * PointMaterial logic：填入 point 着色器，point-list 拓扑、不剔除。
 */
function createPointMaterialLogic(material: PointMaterial): MaterialLogic
{
    const base = createBaseMaterialLogic(material);
    reactive(base.renderPipeline.vertex).wgsl = pointVertexWGSL;
    reactive(base.renderPipeline.fragment).wgsl = pointFragmentWGSL;
    reactive(base.renderPipeline.primitive).topology = 'point-list';
    reactive(base.renderPipeline.primitive).cullFace = 'none';

    return base;
}

/**
 * SegmentMaterial logic：填入 segment 着色器，line-list 拓扑、不剔除、开启 alpha 混合。
 */
function createSegmentMaterialLogic(material: SegmentMaterial): MaterialLogic
{
    const base = createBaseMaterialLogic(material);
    reactive(base.renderPipeline.vertex).wgsl = segmentVertexWGSL;
    reactive(base.renderPipeline.fragment).wgsl = segmentFragmentWGSL;
    reactive(base.renderPipeline.primitive).topology = 'line-list';
    reactive(base.renderPipeline.primitive).cullFace = 'none';
    // 开启 alpha 混合
    reactive(base.renderPipeline.fragment).targets = [{
        blend: {
            color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            alpha: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
        },
    }];

    return base;
}

/**
 * TextureMaterial logic：填入 texture 着色器，监听 s_texture 变化重算绑定。
 */
function createTextureMaterialLogic(material: TextureMaterial): MaterialLogic
{
    const base = createBaseMaterialLogic(material);
    reactive(base.renderPipeline.vertex).wgsl = textureVertexWGSL;
    reactive(base.renderPipeline.fragment).wgsl = textureFragmentWGSL;
    reactive(base.renderPipeline.primitive).topology = 'triangle-list';
    reactive(base.renderPipeline.primitive).cullFace = 'back';
    reactive(base.renderPipeline.primitive).frontFace = 'cw';
    reactive(base.renderPipeline.depthStencil).depthWriteEnabled = true;
    reactive(base.renderPipeline.depthStencil).depthCompare = 'less';

    const updateTexture = () =>
    {
        material.textureViews.s_texture = buildTextureView(material.s_texture);
        material.samplers.s_textureSampler = buildSampler(material.s_texture);
    };
    reactiveEffect(updateTexture);

    return {
        ...base,
        get isLoaded() { return material.s_texture.isLoaded; },
        onLoadCompleted(callback: () => void)
        {
            if (material.s_texture.isLoaded) { callback(); return; }
            material.s_texture.on('loadCompleted', callback);
        },
    };
}

/**
 * SkyBoxMaterial logic：填入 skybox 着色器，不剔除、关闭深度写入、深度比较 less-equal。
 */
function createSkyBoxMaterialLogic(material: SkyBoxMaterial): MaterialLogic
{
    const base = createBaseMaterialLogic(material);
    reactive(base.renderPipeline.vertex).wgsl = skyboxVertexWGSL;
    reactive(base.renderPipeline.fragment).wgsl = skyboxFragmentWGSL;
    reactive(base.renderPipeline.primitive).cullFace = 'none';
    reactive(base.renderPipeline.depthStencil).depthWriteEnabled = false;
    reactive(base.renderPipeline.depthStencil).depthCompare = 'less-equal';

    const updateTexture = () =>
    {
        material.textureViews.s_skyboxTexture = buildTextureView(material.s_skyboxTexture);
        material.samplers.s_skyboxTextureSampler = buildSampler(material.s_skyboxTexture);
    };
    reactiveEffect(updateTexture);

    return {
        ...base,
        get isLoaded() { return material.s_skyboxTexture.isLoaded; },
        onLoadCompleted(callback: () => void)
        {
            if (material.s_skyboxTexture.isLoaded) { callback(); return; }
            material.s_skyboxTexture.on('loadCompleted', callback);
        },
    };
}

// ---- 注册到 logic 分发表 ----

registerLogic('Material', createBaseMaterialLogic);
registerLogic('ColorMaterial', createColorMaterialLogic);
registerLogic('StandardMaterial', createStandardMaterialLogic);
registerLogic('PointMaterial', createPointMaterialLogic);
registerLogic('SegmentMaterial', createSegmentMaterialLogic);
registerLogic('TextureMaterial', createTextureMaterialLogic);
registerLogic('SkyBoxMaterial', createSkyBoxMaterialLogic);

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
