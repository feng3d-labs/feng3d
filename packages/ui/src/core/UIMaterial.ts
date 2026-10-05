import { defaultTexture, globalUniformsWGSL, isTextureResource, materialLogic, transformUniformsWGSL, writeMaterialBase } from 'feng3d';
import type { Color4, Material, MaterialLogic, TextureField } from 'feng3d';
import { reactive, registerLogic, toRaw } from '@feng3d/reactivity';
import type { RenderObject, RenderPipeline, Sampler, Texture, TextureView } from '@feng3d/webgpu';
import type { Vector4 } from '@feng3d/math';

declare global
{
    export interface MixinsUniforms extends UIUniforms
    {
    }
}

declare module 'feng3d'
{
    export interface MaterialMap
    {
        UIMaterial: UIMaterial;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        UIMaterial: UIMaterialLogic;
    }
}

/**
 * UI 材质的 uniform 数据（纯数据接口）。
 *
 * 迁移前的 `UIUniforms` 是带 `@serialize` / `@oav` 装饰器的 class：新范式下数据一律是
 * 纯数据接口（装饰器只在 class 上可用，字段描述改由 `__type__` + 类型驱动的属性面板生成），
 * 故改为 interface + {@link createUIUniforms} 默认值工厂（对应原 class 的字段初始值）。
 *
 * ⚠️ 坐标空间：UI 的顶点是**画布像素空间**（`UIGeometry` 是单位四边形，按 `u_rect` 展开后
 * 直接是像素尺寸；宿主对象的位置由 `TransformLayout` 按锚点算出，单位同样是像素）。
 * 因此 UI 的着色器不用相机的 `cameraUniforms.u_viewProjection`，而用
 * `globalUniforms.u_Viewport`（画布像素尺寸，由 `ForwardRenderer.prepareExtraRenderObjects`
 * 注入）把像素坐标转成 NDC——这正是"相机无关的正交投影"。
 */
export interface UIUniforms
{
    /**
     * UI几何体尺寸，在shader中进行对几何体缩放。
     */
    readonly u_rect?: Vector4;

    /**
     * 颜色
     */
    readonly u_color?: Color4;

    /**
     * 纹理数据
     */
    readonly s_texture?: TextureField;

    /**
     * 控制图片的显示区域。
     */
    readonly u_uvRect?: Vector4;
}

/**
 * UI uniform 容器的**可写形状**（§11.3：读侧 `UIUniforms` 全只读，写侧单独声明）。
 *
 * 容器的实际载体是渲染对象上的动态字段 `renderObject.uniforms`（见 {@link uiUniforms}），
 * 该字段不属于 `RenderObject` 的公开类型，故本形状只在 UI 包内部使用。
 */
export interface WritableUIUniforms
{
    u_rect?: Vector4;
    u_color?: Color4;
    s_texture?: TextureField;
    u_uvRect?: Vector4;
}

/**
 * 创建 UI uniform 默认值（等价于迁移前的 `new UIUniforms()`）。
 *
 * 各 Color4 / Vector4 字面量每次新建，避免调用方之间共享同一个可变对象。
 *
 * ⚠️ `u_color` 是**白色**：原 `UIUniforms.u_color = new Color4()`，而旧 math `Color4` class 的
 * 无参默认值是 `r = g = b = a = 1`（不是黑色，见 `packages/math/src/color/color4.ts` 文件头
 * 关于 `a` 的说明）。第 1 批迁移时误写成黑色，第 3 批核对旧 class 默认值后修正。
 */
export function createUIUniforms(): WritableUIUniforms
{
    return {
        u_rect: { __type__: 'Vector4', x: 0, y: 0, z: 100, w: 100 },
        u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        s_texture: defaultTexture,
        u_uvRect: { __type__: 'Vector4', x: 0, y: 0, z: 1, w: 1 },
    };
}

/**
 * 取渲染对象上的 UI uniform 容器（缺失时就地创建）。
 *
 * `RenderObject` 本身没有 `uniforms` 字段（它的绑定数据在 `bindingResources` 上）；
 * 主仓的 `Material` 体系要求 uniform 数据由**材质**写入 `bindingResources.material_uniforms`，
 * 而 UI 的 uniform 却由**同对象的多个组件**（`Transform2D` 写 `u_rect`、`Rect` 写 `u_color`、
 * `Image` / `Text` 写 `s_texture`）分别产出——没有哪个组件持有全部数据。
 *
 * 于是容器定为渲染对象上的这个动态字段：`UIMaterialLogic.beforeRender` 把**容器本身**
 * 作为 `material_uniforms` 的 value 交给 GPU（不是拷贝快照），组件后续写进来的字段
 * 因此会命中 `WGPUBufferBinding` 的字段级 computed，在提交前按需重传。
 *
 * 为什么每个 UI 组件都要经本函数取容器：渲染链按宿主的 `components` 顺序分发 `beforeRender`，
 * 若只在 `CanvasRenderer` 里创建容器，排在它前面的 `Transform2D` 就会往 `undefined` 上写
 * （`Cannot set properties of undefined`）；谁先写谁创建，后写的拿到同一个容器。
 *
 * ⚠️ 返回值是**原始对象**（规范 §8.2：不返回响应式对象）。写入方需要按字段触发响应式时，
 * 在**写入点**用 `reactive(容器).字段 = 值` 包一层（`reactive()` 有缓存，同一对象返回同一代理）。
 *
 * @param renderObject 渲染对象
 * @returns 该渲染对象的 UI uniform 容器（同一渲染对象上始终是同一个对象）
 */
export function uiUniforms(renderObject: RenderObject): WritableUIUniforms
{
    const ro = renderObject as RenderObject & { uniforms?: WritableUIUniforms };

    return ro.uniforms ||= {};
}

/**
 * 补齐容器里缺失的 uniform 字段（就地写，不覆盖调用方已写的值）。
 *
 * 缺字段的后果不是"用默认值渲染"，而是 `WGPUBufferBinding` 直接**放弃上传该项**
 * （GPU 侧该字段恒为 0：`u_rect.zw = 0` 会让 UI 塌成一个点），所以必须在材质 `beforeRender`
 * 里兜住；全部字段都齐时直接返回，避免每帧新建默认值对象。
 *
 * @param uniforms UI uniform 容器
 */
function fillUIUniformDefaults(uniforms: WritableUIUniforms): void
{
    if (uniforms.u_rect && uniforms.u_color && uniforms.s_texture && uniforms.u_uvRect) return;

    const defaults = createUIUniforms();
    const r_uniforms = reactive(uniforms);

    if (r_uniforms.u_rect === undefined) r_uniforms.u_rect = defaults.u_rect;
    if (r_uniforms.u_color === undefined) r_uniforms.u_color = defaults.u_color;
    if (r_uniforms.s_texture === undefined) r_uniforms.s_texture = defaults.s_texture;
    if (r_uniforms.u_uvRect === undefined) r_uniforms.u_uvRect = defaults.u_uvRect;
}

/**
 * UI 纹理采样器：clamp-to-edge + 线性过滤。
 *
 * 不用 repeat 寻址：UI 的 uv 通常正好落在 `[0,1]` 边界上，repeat 会把对侧像素采到边缘
 * （`u_uvRect` 缩放后尤其明显）；也不用 mipmap：UI 纹理多为运行时画布/图片，
 * 没有 mip 链（`WGPUBindGroupEntry` 还会为此打一条警告）。
 */
const UI_SAMPLER: Sampler = {
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
    magFilter: 'linear',
    minFilter: 'linear',
};

/**
 * UI 材质（纯数据接口）。
 *
 * uniform 数据不在本接口上声明字段——UI 的 uniform 由同对象的 UI 组件在渲染前写入渲染对象的
 * uniform 容器（见 {@link uiUniforms}）。本材质的职责是提供 UI 着色器、渲染状态与纹理绑定。
 */
export interface UIMaterial extends Material
{
    readonly __type__: 'UIMaterial';
}

/**
 * UIMaterial 逻辑接口：填入 UI 着色器（像素空间 + `u_rect` / `u_color` / `s_texture` / `u_uvRect`）。
 *
 * 渲染状态的选择（与迁移前 UI 的渲染状态一致）：
 * - `cullFace: 'none'`——UI 双面可见（拾取侧同样是 `CullFace.NONE`）；
 * - `depthWriteEnabled: false` + `depthCompare: 'always'`——UI 不参与深度竞争；
 *   覆盖关系由**独立的 UI Pass** 保证（排在主 Pass 之后、颜色附件 `loadOp: 'load'`）；
 * - alpha 混合开启——UI 的图片 / 文字 / 半透明色块都要混合。
 */
export interface UIMaterialLogic extends MaterialLogic
{
    /**
     * 同步 UI 纹理绑定（在渲染对象提交前可重复调用）。
     *
     * 需要它是因为渲染顺序：`Renderable` 的 renderObject computed 先跑材质 `beforeRender`、
     * 再跑同对象其他组件的 `beforeRender`——`Image` / `Text` 写的 `s_texture` 在材质之后，
     * 首帧材质绑定到的是占位纹理。`CanvasRendererLogic` 在自己的 `beforeRender` 末尾补调一次本方法。
     *
     * @param renderObject 渲染对象
     */
    syncRenderObject(renderObject: RenderObject): void;
}

/**
 * 工厂函数：UIMaterialLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 材质数据（raw）
 */
export function uiMaterialLogic(data: UIMaterial): UIMaterialLogic
{
    const renderPipeline = reactive({
        vertex: { wgsl: uiMaterialWGSL },
        fragment: {
            wgsl: uiMaterialWGSL,
            targets: [{
                blend: {
                    color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                    alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                },
            }],
        },
        primitive: { topology: 'triangle-list', cullFace: 'none', frontFace: 'ccw' },
        depthStencil: { depthWriteEnabled: false, depthCompare: 'always' },
    }) as RenderPipeline;

    /**
     * 纹理视图缓存：同一 `Texture` 复用同一 `TextureView`。
     *
     * 稳定引用是关键——每次重算新建 view 对象会让 `WGPUTextureView` 缓存失效、GPU 纹理反复重建。
     */
    const textureViews = new Map<Texture, TextureView>();

    /**
     * 取纹理的视图（同一纹理复用同一视图对象）。
     *
     * @param texture 纹理
     * @returns 2d 纹理视图
     */
    const textureViewOf = (texture: Texture): TextureView =>
    {
        let view = textureViews.get(texture);
        if (!view)
        {
            view = { texture: texture as unknown as TextureView['texture'], dimension: '2d' };
            textureViews.set(texture, view);
        }

        return view;
    };

    /**
     * 同步 UI 纹理绑定（{@link UIMaterialLogic.syncRenderObject} 的实现）。
     *
     * 容器里的 `s_texture` 是**运行时 `Texture`**（`Image` / `Text` 组件已在各自的
     * `beforeRender` 里经 `resolveTexture` 解析过），这里只做视图与采样器绑定。
     */
    const syncRenderObject = (renderObject: RenderObject): void =>
    {
        const uniforms = uiUniforms(renderObject);
        const field = uniforms.s_texture;
        // 声明式引用（`{ __type__: 'Texture', url }`）在材质 beforeRender 里已换成占位纹理；
        // 走到这里说明组件刚写入原始引用（首帧），按占位纹理绑定，加载完成后由响应式链换装。
        const texture = !field || isTextureResource(field) ? defaultTexture : toRaw(field as Texture);
        const view = textureViewOf(texture);
        const bindingResources = renderObject.bindingResources;
        if (!bindingResources || bindingResources.s_texture === view) return;

        const r_bindingResources = reactive(bindingResources);
        r_bindingResources.s_texture = view;
        r_bindingResources.s_textureSampler = UI_SAMPLER;
    };

    // 组合基类工厂：未覆写的成员显式委托（不要用 ...base 展开——会把 getter 立刻求值）
    const base = materialLogic(data);

    const logic: UIMaterialLogic = {
        // 半透明（alpha 混合启用）：供渲染排序 / 分组查询
        get isTransparent() { return true; },
        get isPrimitivesTopology() { return base.isPrimitivesTopology; },
        get isLoaded() { return base.isLoaded; },
        syncRenderObject,
        beforeRender(renderObject)
        {
            const uniforms = uiUniforms(renderObject);
            fillUIUniformDefaults(uniforms);

            // 容器本身作为 material_uniforms 的 value（不是快照）：组件与 CanvasRenderer 在
            // 本方法之后的字段写入，仍能命中 WGPUBufferBinding 的字段级 computed，提交前重传。
            writeMaterialBase(renderObject, renderPipeline, () => uniforms);

            // 纹理在这里只做绑定；声明式引用（`{ __type__: 'Texture', url }`）的解析由写入方
            // （Image / Text 组件的 beforeRender 调 resolveTexture）负责——那才是建立响应式依赖、
            // 加载完成后自动换装的位置。若在本方法里再 resolve 一次，等于在 computed 求值期间
            // 写回自己依赖的字段，会引发自激失效。
            syncRenderObject(renderObject);
        },
    };

    return logic;
}

// 注册到 logic 分发表（issue #653：注册值只能是工厂函数，`logic()` 直接调用而不是 `new`）
registerLogic('UIMaterial', uiMaterialLogic);

/**
 * 创建 UI 默认材质。
 *
 * 迁移前这里是 `Material.setDefault('Default-UIMaterial', new StandardMaterial())`：
 * 把材质登记进默认材质注册表（主仓已移除该注册表）。迁移期间本函数返回
 * `{ __type__: 'StandardMaterial' }` 占位，导致 UI 用标准光照着色器渲染
 * （`u_rect` 无人消费、UI 尺寸与颜色全错）——本批换成真正的 UI 材质。
 *
 * @returns UI 材质数据
 */
export function createUIMaterial(): UIMaterial
{
    return { __type__: 'UIMaterial' };
}

/**
 * UI 着色器（WGSL）。
 *
 * 与旧 `@feng3d/ui` 的 UI 着色器逐条对应（`u_rect` 缩放单位四边形、`u_uvRect` 裁切纹理、
 * `u_color` 染色、`s_texture` 采样），差异只有投影来源：
 *
 * - 旧实现从渲染前写入的 uniform `u_viewProjection`（= `CanvasLogic.projection`）取投影；
 *   新架构改用 UI Pass 里引擎注入的 `globalUniforms.u_Viewport`（画布像素尺寸）直接做
 *   像素 → NDC 变换：`ndc.x = x / width * 2 - 1`、`ndc.y = 1 - y / height * 2`。
 *   这就是"相机无关的正交投影"——UI 与 3D 相机的视锥 / 位置完全无关。
 *
 * - `z` 恒为 0：UI 材质 `depthWriteEnabled: false` + `depthCompare: 'always'`，
 *   深度不参与判定；UI 之间的先后由 UI Pass 内 renderObject 的顺序（树序）决定。
 *
 * 绑定点位沿用主仓材质约定：`transform` 为 `@group(0) @binding(0)`（见 `transformUniformsWGSL`），
 * `globalUniforms` 为 `@group(0) @binding(2)`（见 `globalUniformsWGSL`），
 * `material_uniforms` 为 `@group(0) @binding(3)`（与 `ColorMaterial` / `StandardMaterial` 一致），
 * 纹理与采样器放 `@group(1)`（与 `StandardMaterial` 的 `s_diffuse` 同组）。
 */
export const uiMaterialWGSL = transformUniformsWGSL + globalUniformsWGSL + `
struct VertexInput {
    @location(0) a_position: vec3<f32>,
    @location(3) a_uv: vec2<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}

struct UIUniforms {
    u_rect: vec4<f32>,
    u_color: vec4<f32>,
    u_uvRect: vec4<f32>,
}

@group(0) @binding(3) var<uniform> material_uniforms: UIUniforms;

@group(1) @binding(0) var s_textureSampler: sampler;
@group(1) @binding(1) var s_texture: texture_2d<f32>;

@vertex
fn vertex(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    // 单位四边形 (0,0)-(1,1) 按 u_rect 缩放并偏移（u_rect.xy = 左上角偏移，u_rect.zw = 宽高）
    let localPosition = vec4<f32>(
        input.a_position.xy * material_uniforms.u_rect.zw + material_uniforms.u_rect.xy,
        0.0,
        1.0,
    );
    let worldPosition = transform.u_modelMatrix * localPosition;

    // 画布像素坐标 → NDC（x 向右、y 向下；画布尺寸由 UI Pass 注入 globalUniforms）
    output.position = vec4<f32>(
        worldPosition.x / globalUniforms.u_Viewport.x * 2.0 - 1.0,
        1.0 - worldPosition.y / globalUniforms.u_Viewport.y * 2.0,
        0.0,
        1.0,
    );

    output.uv = input.a_uv * material_uniforms.u_uvRect.zw + material_uniforms.u_uvRect.xy;

    return output;
}

struct FragmentOutput {
    @location(0) color: vec4<f32>,
}

@fragment
fn fragment(input: VertexOutput) -> FragmentOutput {
    var output: FragmentOutput;

    let textureColor = textureSample(s_texture, s_textureSampler, input.uv);

    // 逐分量书写：texel 色与 u_color 直接相乘的历史坑是 uniform 的第 4 个分量
    // （alpha）传到 GPU 后可能为 0（见 ColorMaterial / SegmentMaterial 的同款注释），
    // 相乘会让整个 UI 完全透明。
    output.color = vec4<f32>(
        textureColor.r * material_uniforms.u_color.r,
        textureColor.g * material_uniforms.u_color.g,
        textureColor.b * material_uniforms.u_color.b,
        textureColor.a * material_uniforms.u_color.a,
    );

    return output;
}
`;