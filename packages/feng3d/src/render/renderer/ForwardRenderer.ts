import { Matrix4x4, Vector2, Vector3 } from '@feng3d/math';
import { computed, Computed, logic, reactive } from '@feng3d/reactivity';
import { BufferBinding, RenderObject, Sampler, Texture, TextureView } from '@feng3d/webgpu';
import type { Camera } from '../../cameras/Camera';
import type { Color4 } from '../../core/Color4';

// ---- BindingResources 类型扩展（ForwardRenderer 写入的 uniform bindings） ----

declare module '@feng3d/webgpu'
{
    interface BindingResources
    {
        lights?: BufferBinding<LightsUniform>;
        shadowData?: BufferBinding<ShadowDataUniform>;
    }
}
import type { Scene } from '../../scene/Scene';
import { ShadowType } from '../../light/shadow/ShadowType';

/** 点光源最大数量（与 WGSL array<PointLightData, 8> 一致） */
const MAX_POINT_LIGHTS = 8;

/** 阴影比较采样器（compare='less'，全场景共享，配置无状态） */
const SHADOW_MAP_COMPARISON_SAMPLER: Sampler = { compare: 'less' };

/**
 * 方向光 uniform 数据（WGSL DirectionalLightData 布局）。
 */
interface DirectionalLightUniform
{
    direction: number[];
    intensity: number;
    color: number[];
    _pad0: number;
}

/**
 * 点光源 uniform 数据（WGSL PointLightData 布局）。
 */
interface PointLightUniform
{
    position: number[];
    range: number;
    color: number[];
    intensity: number;
}

/**
 * 聚光灯 uniform 数据（WGSL SpotLightData 布局）。
 *
 * 对应 StandardMaterial WGSL 的 SpotLightData struct（与 PointLightData 同布局 + 4 个 f32）：
 * position/range/color/intensity（与点光源一致）+ direction/coneCos/penumbraCos/_pad1。
 */
interface SpotLightUniform
{
    position: number[];
    range: number;
    color: number[];
    intensity: number;
    direction: number[];
    coneCos: number;
    penumbraCos: number;
    _pad1: number;
}

/**
 * 阴影 uniform 数据（WGSL ShadowData struct 布局）。
 */
export interface ShadowDataUniform
{
    u_shadowVP: Matrix4x4;
    u_lightPosition: Vector3 | number[];
    u_shadowCameraNear: number;
    u_shadowCameraFar: number;
    u_shadowBias: number;
    u_shadowEnabled: number;
    _pad0: number;
    _pad1: number;
}

/**
 * 光源 uniform 数据（WGSL LightsUniform struct 布局）。
 */
export interface LightsUniform
{
    u_directionalLight: DirectionalLightUniform;
    u_pointLightCount: number;
    _pad0: number;
    _pad1: number;
    _pad2: number;
    u_pointLights: PointLightUniform[];
    u_spotLight: SpotLightUniform;
}

/**
 * 构建光源 uniform computed（按 WGSL LightsUniform struct 布局）。
 *
 * 返回 Computed，使 WGPUBufferBinding 的 effect 能追踪光源 position/direction 等
 * 响应式依赖，光源移动时自动重算。
 */
function createLightsUniformComputed(scene: Scene): Computed<LightsUniform>
{
    return computed(() => buildLightsUniform(scene));
}

/**
 * 构建光源 uniform 数据（按 WGSL LightsUniform struct 布局）。
 */
function buildLightsUniform(scene: Scene): LightsUniform
{
    const sLogic = logic(scene);
    const dirLights = sLogic.activeDirectionalLights;
    const pointLights = sLogic.activePointLights;
    const spotLights = sLogic.activeSpotLights;

    // 方向光（取第一个）
    const dirLight = dirLights.length > 0 ? dirLights[0] : null;
    const dirDir = dirLight ? logic(dirLight).direction : new Vector3();
    const dirColor = dirLight ? dirLight.color : { r: 0, g: 0, b: 0 };
    const dirIntensity = dirLight ? (dirLight.intensity ?? 1) : 0;

    // 点光源（最多 MAX_POINT_LIGHTS 个）
    const pointLightCount = Math.min(pointLights.length, MAX_POINT_LIGHTS);
    const pointLightArray: PointLightUniform[] = [];
    for (let i = 0; i < MAX_POINT_LIGHTS; i++)
    {
        if (i < pointLightCount)
        {
            const pl = pointLights[i];
            const pos = logic(pl).position as Vector3;
            pointLightArray.push({
                position: [pos.x, pos.y, pos.z],
                range: pl.range ?? 10,
                color: [pl.color?.r ?? 1, pl.color?.g ?? 1, pl.color?.b ?? 1],
                intensity: pl.intensity ?? 1,
            });
        }
        else
        {
            pointLightArray.push({
                position: [0, 0, 0],
                range: 0,
                color: [0, 0, 0],
                intensity: 0,
            });
        }
    }

    // 聚光灯（取第一个）
    const spotLight = spotLights.length > 0 ? spotLights[0] : null;
    const spotUniform: SpotLightUniform = (() =>
    {
        if (!spotLight) return {
            position: [0, 0, 0], range: 0, color: [0, 0, 0], intensity: 0,
            direction: [0, 0, 0], coneCos: 0, penumbraCos: 0, _pad1: 0,
        };
        const slLogic = logic(spotLight);
        const pos = slLogic.position;
        const dir = slLogic.direction;

        return {
            position: [pos.x, pos.y, pos.z],
            range: spotLight.range ?? 10,
            color: [spotLight.color?.r ?? 1, spotLight.color?.g ?? 1, spotLight.color?.b ?? 1],
            intensity: spotLight.intensity ?? 1,
            direction: [dir.x, dir.y, dir.z],
            coneCos: slLogic.coneCos,
            penumbraCos: slLogic.penumbraCos,
            _pad1: 0,
        };
    })();

    return {
        u_directionalLight: {
            direction: [dirDir.x, dirDir.y, dirDir.z],
            intensity: dirIntensity,
            color: [dirColor?.r ?? 0, dirColor?.g ?? 0, dirColor?.b ?? 0],
            _pad0: 0,
        },
        u_pointLightCount: pointLightCount,
        _pad0: 0,
        _pad1: 0,
        _pad2: 0,
        u_pointLights: pointLightArray,
        u_spotLight: spotUniform,
    };
}

/**
 * 前向渲染器
 */
export class ForwardRenderer
{
    /** 光源 uniform computed 缓存（按 scene 缓存，避免每帧重建） */
    private _lightsUniformCache = new WeakMap<Scene, Computed<LightsUniform>>();

    /**
     * 渲染对象列表 computed 缓存（按 scene → camera 嵌套缓存）。
     *
     * Scene/Camera 运行时均为普通对象，引用相等即可作 WeakMap key；对象 GC 时对应
     * computed 自动失效，无泄漏。
     */
    private _renderObjectsCache = new WeakMap<Scene, WeakMap<Camera, Computed<readonly RenderObject[]>>>();
    /**
     * 阴影深度占位纹理（1×1 depth24plus）。
     *
     * 无方向光阴影时填充 s_shadowMap binding，避免 WGSL texture_depth_2d 绑定
     * 非 depth 格式纹理（如 defaultTexture）导致 sample type 校验失败。
     */
    private _placeholderShadowDepth: Texture | null = null;

    /** 获取阴影深度占位纹理（懒创建） */
    private getPlaceholderShadowDepth(): Texture
    {
        if (!this._placeholderShadowDepth)
        {
            // 直接用 webgpu Texture 接口构造（与 DirectionalLight.shadowDepthTexture 同范式）
            this._placeholderShadowDepth = {
                descriptor: {
                    label: 'PlaceholderShadowDepth',
                    size: [1, 1],
                    format: 'depth24plus',
                },
            } as Texture;
        }

        return this._placeholderShadowDepth;
    }

    /**
     * 渲染
     *
     * 返回 `Computed<readonly RenderObject[]>`，按 (scene, camera) 缓存。
     * 变更驱动失效（框架设计文档 4.1）：scene 内容（拾取缓存 computed）、
     * 相机变换（cameraUniforms computed）、画布尺寸（viewport computed）、
     * 光源（lightsUniform computed）任一变化时自动重算；静态场景零重算。
     */
    draw(scene: Scene, camera: Camera, viewport: Computed<readonly [number, number]>): Computed<readonly RenderObject[]>
    {
        // 命中缓存直接返回同一 computed 实例，保证下游依赖稳定
        let cameraMap = this._renderObjectsCache.get(scene);
        if (!cameraMap)
        {
            cameraMap = new WeakMap();
            this._renderObjectsCache.set(scene, cameraMap);
        }
        const cached = cameraMap.get(camera);
        if (cached) return cached;

        const self = this;

        // ---- 共享绑定包装（设计文档 G3 / 6 章）----
        // 相机/全局/光源/阴影 uniform 对同一 (scene, camera) 的所有 renderObject 值相同：
        // 所有 renderObject 的 bindingResources 引用同一批 wrapper——WGPUBufferBinding 按
        // wrapper 缓存，N 个对象共享 1 个 GPUBuffer（原每对象一个、相机移动时千次 buffer 写入）；
        // 每帧只更新一次 .value，对象注入用身份比较跳过未变写入。
        const _sharedCameraUniforms: BufferBinding = { value: null as never };
        const _sharedGlobalUniforms: BufferBinding = { value: null as never };
        const _sharedLights: BufferBinding = { value: null as never };
        const _sharedShadowData: BufferBinding = { value: null as never };
        const _sharedShadowMap: { texture: Texture } = { texture: null as never };

        const computedRenderObjects = computed<readonly RenderObject[]>(() =>
        {
            const sLogic = logic(scene);
            const blenditems = sLogic.getPickCache(camera).blenditems;
            const unblenditems = sLogic.getPickCache(camera).unblenditems;

            // cameraUniforms 是响应式 computed（CameraLogic.uniforms），其 .value 依赖
            // viewMatrix/lens 等，相机变换变化时自动失效。bindingResources 持有同一 computed 引用，
            // 上游 WGPUBufferBinding 会重新读取 .value 并上传到 GPU。
            const cameraUniforms = logic(camera).uniforms;
            const vp = viewport.value;
            const globalUniforms: GlobalUniforms = {
                u_sceneAmbientColor: scene.ambientColor ?? { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } as Color4,
                u_Viewport: new Vector2(vp[0], vp[1])
            };

            // 光源 uniform computed（按 scene 缓存，光源移动时自动重算）
            let lightsUniform = self._lightsUniformCache.get(scene);
            if (!lightsUniform)
            {
                lightsUniform = createLightsUniformComputed(scene);
                self._lightsUniformCache.set(scene, lightsUniform);
            }

            // 阴影数据（方向光）
            const dirLights = sLogic.activeDirectionalLights;
            const shadowLight = dirLights.find(l => (l.shadowType ?? ShadowType.No_Shadows) !== ShadowType.No_Shadows);
            let shadowDataValue: ShadowDataUniform | null = null;
            let shadowMapTexture: Texture | null = null;
            if (shadowLight)
            {
                const sLightLogic = logic(shadowLight);
                // 直接用光源 logic 的 shadowViewProjection（ShadowRenderer 渲染阴影图时由
                // updateShadowByCamera 写入，与此处读取完全一致，避免时序/缓存不匹配）。
                const shadowVP = sLightLogic.shadowViewProjection;
                shadowDataValue = {
                    u_shadowVP: shadowVP,
                    u_lightPosition: sLightLogic.position,
                    u_shadowCameraNear: sLightLogic.shadowCameraNear,
                    u_shadowCameraFar: sLightLogic.shadowCameraFar,
                    u_shadowBias: shadowLight.shadowBias ?? 0,
                    u_shadowEnabled: 1,
                    _pad0: 0,
                    _pad1: 0,
                };
                // 阴影采样纹理：方向光用 depth24plus 深度纹理（ShadowRenderer 的 depth-only Pass 写入）
                shadowMapTexture = sLightLogic.shadowDepthTexture;
            }
            if (!shadowDataValue)
            {
                shadowDataValue = {
                    u_shadowVP: new Matrix4x4(),
                    u_lightPosition: [0, 0, 0],
                    u_shadowCameraNear: 0,
                    u_shadowCameraFar: 1,
                    u_shadowBias: 0,
                    u_shadowEnabled: 0,
                    _pad0: 0,
                    _pad1: 0,
                };
            }

            const renderObjects: RenderObject[] = [];

            // 更新共享绑定（每次重算各写一次，O(1)）
            reactive(_sharedCameraUniforms).value = cameraUniforms;
            reactive(_sharedGlobalUniforms).value = globalUniforms;
            reactive(_sharedLights).value = lightsUniform;
            reactive(_sharedShadowData).value = shadowDataValue;
            reactive(_sharedShadowMap).texture = (shadowMapTexture || self.getPlaceholderShadowDepth()) as Texture;

            unblenditems.concat(blenditems).forEach((renderable) =>
            {
                // 绘制
                const renderObject = logic(renderable).renderObject.value;

                const bindingResources = renderObject.bindingResources;

                // ---- 注入共享绑定（相机/全局/光源/阴影）----
                // 身份比较跳过未变写入：首帧赋值后，后续重算仅当 renderObject 重建时才写
                if (bindingResources.cameraUniforms !== _sharedCameraUniforms)
                {
                    const r_bindingResources = reactive(bindingResources);
                    r_bindingResources.cameraUniforms = _sharedCameraUniforms;
                    r_bindingResources.globalUniforms = _sharedGlobalUniforms;
                    r_bindingResources.lights = _sharedLights;
                    r_bindingResources.shadowData = _sharedShadowData;
                    // 阴影 depth 纹理用 webgpu Texture 接口（2d 视图）。
                    // depth24plus 是纯 depth 格式，直接绑定（与参考实现 shadowMapping 一致，
                    // 不需要 aspect:'depth-only'）。
                    r_bindingResources.s_shadowMap = _sharedShadowMap as never;
                    // 阴影采样器为比较采样器（sampler_comparison）：compare='less'
                    // textureSampleCompare 比较 depth_ref < texel_depth：片元深度比存储的最近表面
                    // 更近（没被遮挡）→ 1（照亮），否则 → 0（阴影）。这是标准阴影映射约定。
                    // addressMode 用 clamp-to-edge：越界 uv 钳到边界（边界处深度=clearValue 1.0，
                    // ref<1.0 → 照亮），避免 repeat 把阴影纹理另一侧的内容采到当前片元。
                    // filter 配置无意义：比较采样器只做深度比较，GPU 忽略 filter。
                    r_bindingResources.s_shadowMapSampler = SHADOW_MAP_COMPARISON_SAMPLER;
                }

                logic(renderable).beforeRender(renderObject);

                renderObjects.push(renderObject);
            });

            return renderObjects;
        });

        cameraMap.set(camera, computedRenderObjects);

        return computedRenderObjects;
    }
}

/**
 * 前向渲染器
 */
export const forwardRenderer = new ForwardRenderer();

/**
 * GlobalUniforms WGSL 片段（struct + binding 声明）。
 *
 * 与 ForwardRenderer.draw 中构建的 bindingResources.globalUniforms 对应：
 * - @group(0) @binding(2) var<uniform> globalUniforms
 * - 字段：u_sceneAmbientColor（场景环境光）、u_Viewport（画布像素尺寸）。
 *
 * 着色器（如 StandardMaterial 片段着色器）通过字符串拼接复用本片段，避免重复声明。
 */
export const globalUniformsWGSL = `
struct GlobalUniforms {
    u_sceneAmbientColor: vec4<f32>,
    u_Viewport: vec2<f32>,
}

@group(0) @binding(2) var<uniform> globalUniforms: GlobalUniforms;
`;
