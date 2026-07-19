import { Matrix4x4, Vector3, Vector4 } from '@feng3d/math';
import { computed, Computed, logic, reactive } from '@feng3d/reactivity';
import { BindingResource, BufferBinding, RenderObject, Sampler, Texture } from '@feng3d/webgpu';
import type { Camera } from '../../cameras/Camera';
import type { Scene } from '../../scene/Scene';

/** 点光源最大数量（与 WGSL array<PointLightData, 8> 一致） */
const MAX_POINT_LIGHTS = 8;

/**
 * 构建光源 uniform computed（按 WGSL LightsUniform struct 布局）。
 *
 * 返回 Computed，使 WGPUBufferBinding 的 effect 能追踪光源 position/direction 等
 * 响应式依赖，光源移动时自动重算。
 */
function createLightsUniformComputed(scene: Scene): Computed<Record<string, any>>
{
    return computed(() => buildLightsUniform(scene));
}

/**
 * 构建光源 uniform 数据（按 WGSL LightsUniform struct 布局）。
 */
function buildLightsUniform(scene: Scene): Record<string, any>
{
    const sLogic = logic(scene);
    const dirLights = sLogic.activeDirectionalLights;
    const pointLights = sLogic.activePointLights;

    // 方向光（取第一个）
    const dirLight = dirLights.length > 0 ? dirLights[0] : null;
    const dirDir = dirLight ? logic(dirLight).direction : new Vector3();
    const dirColor = dirLight ? dirLight.color : { r: 0, g: 0, b: 0 };
    const dirIntensity = dirLight ? (dirLight.intensity ?? 1) : 0;

    // 点光源（最多 MAX_POINT_LIGHTS 个）
    const pointLightCount = Math.min(pointLights.length, MAX_POINT_LIGHTS);
    const pointLightArray: any[] = [];
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
    };
}

/**
 * 前向渲染器
 */
export class ForwardRenderer
{
    /** 光源 uniform computed 缓存（按 scene 缓存，避免每帧重建） */
    private _lightsUniformCache = new WeakMap<Scene, Computed<Record<string, any>>>();

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
     * 调用方传入 `frame`（每帧自增的版本号 computed）作为响应式驱动源——
     * 每帧 `frame.value` 变化使本 computed 失效，重算 `_Time`、globalUniforms、
     * 遍历 blenditems/unblenditems，返回新的 RenderObject[]。
     *
     * 其它失效源：scene 内容变化（getPickCache 重算）、相机变换（cameraUniforms）、
     * 光源变化（lightsUniform）都会自动级联，无需手动驱动。
     */
    draw(scene: Scene, camera: Camera, frame: Computed<number>): Computed<readonly RenderObject[]>
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
        const computedRenderObjects = computed<readonly RenderObject[]>(() =>
        {
            // 每帧驱动源：读 frame 建立依赖。ticker 每帧 ++frame → 本 computed 失效重算。
            frame.value;

            const sLogic = logic(scene);
            const blenditems = sLogic.getPickCache(camera).blenditems;
            const unblenditems = sLogic.getPickCache(camera).unblenditems;

            // cameraUniforms 是响应式 computed（CameraLogic.uniforms），其 .value 依赖
            // viewMatrix/lens 等，相机变换变化时自动失效。bindingResources 持有同一 computed 引用，
            // 上游 WGPUBufferBinding 会重新读取 .value 并上传到 GPU。
            const cameraUniforms = logic(camera).uniforms;
            // _Time 每帧随 frame 失效重算（ctime 来自 Date.now，非响应式源，
            // 靠 frame 版本号驱动）
            const ctime = (Date.now() / 1000) % 3600;
            const globalUniforms: GlobalUniforms = {
                u_sceneAmbientColor: scene.ambientColor,
                _Time: new Vector4(ctime / 20, ctime, ctime * 2, ctime * 3)
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
            const shadowLight = dirLights.find(l => l.shadowType && l.shadowType !== 0);
            let shadowDataValue: any = null;
            let shadowMapTexture: any = null;
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

            unblenditems.concat(blenditems).forEach((renderable) =>
            {
                // 绘制
                const renderObject = logic(renderable).renderObject.value;

                const bindingResources = renderObject.bindingResources as { [key: string]: BindingResource };

                // ---- 注入相机 / 全局 / 光源 uniform ----
                // 复用已有 binding 对象（避免每帧创建新引用导致 WGPUBufferBinding 缓存膨胀）
                if (!bindingResources.cameraUniforms)
                {
                    bindingResources.cameraUniforms = { value: cameraUniforms };
                    bindingResources.globalUniforms = { value: globalUniforms };
                    bindingResources.lights = { value: lightsUniform };
                    bindingResources.shadowData = { value: shadowDataValue };
                    // 阴影 depth 纹理用 webgpu Texture 接口（2d 视图）。
                    const shadowTexture = (shadowMapTexture || self.getPlaceholderShadowDepth()) as Texture;
                    bindingResources.s_shadowMap = {
                        texture: shadowTexture as any,
                        dimension: '2d',
                    };
                    // 阴影采样器为比较采样器（sampler_comparison）：compare='less'
                    // textureSampleCompare 比较 depth_ref < texel_depth：片元深度比存储的最近表面
                    // 更近（没被遮挡）→ 1（照亮），否则 → 0（阴影）。这是标准阴影映射约定。
                    // addressMode 用 clamp-to-edge：越界 uv 钳到边界（边界处深度=clearValue 1.0，
                    // ref<1.0 → 照亮），避免 repeat 把阴影纹理另一侧的内容采到当前片元。
                    // filter 配置无意义：比较采样器只做深度比较，GPU 忽略 filter。
                    const shadowSampler: Sampler = {
                        compare: 'less',
                        addressModeU: 'clamp-to-edge',
                        addressModeV: 'clamp-to-edge',
                    };
                    bindingResources.s_shadowMapSampler = shadowSampler;
                }
                else
                {
                    reactive(bindingResources.cameraUniforms as BufferBinding).value = cameraUniforms;
                    reactive(bindingResources.globalUniforms as BufferBinding).value = globalUniforms;
                    reactive(bindingResources.lights as BufferBinding).value = lightsUniform;
                    reactive(bindingResources.shadowData as BufferBinding).value = shadowDataValue;
                }

                logic(renderable).beforeRender(renderObject, scene, camera);

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
 * - 字段：u_sceneAmbientColor（场景环境光）、_Time（时间向量）。
 *
 * 着色器（如 StandardMaterial 片段着色器）通过字符串拼接复用本片段，避免重复声明。
 */
export const globalUniformsWGSL = `
struct GlobalUniforms {
    u_sceneAmbientColor: vec4<f32>,
    _Time: vec4<f32>,
}

@group(0) @binding(2) var<uniform> globalUniforms: GlobalUniforms;
`;
