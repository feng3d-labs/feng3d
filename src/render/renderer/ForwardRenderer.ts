import { Vector3, Vector4, Matrix4x4 } from '@feng3d/math';
import { BindingResource, RenderPass, RenderPassObject, Submit } from '@feng3d/webgpu';
import { logic, computed, Computed } from '@feng3d/reactivity';
import type { Camera } from '../../cameras/Camera';
import type { Renderable } from '../../core/Renderable';
import type { Scene } from '../../scene/Scene';
import { Texture2D } from '../../textures/Texture2D';
import { buildSampler, buildTextureView } from '../webgpu/MaterialPipeline';

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
     * 阴影深度占位纹理（1×1 depth24plus）。
     *
     * 无方向光阴影时填充 s_shadowMap binding，避免 WGSL texture_depth_2d 绑定
     * 非 depth 格式纹理（如 Texture2D.white）导致 sample type 校验失败。
     */
    private _placeholderShadowDepth: Texture2D | null = null;

    /** 获取阴影深度占位纹理（懒创建） */
    private getPlaceholderShadowDepth(): Texture2D
    {
        if (!this._placeholderShadowDepth)
        {
            this._placeholderShadowDepth = new Texture2D();
            this._placeholderShadowDepth.descriptor = {
                label: 'PlaceholderShadowDepth',
                size: [1, 1],
                format: 'depth24plus',
            };
        }

        return this._placeholderShadowDepth;
    }

    /**
     * 渲染
     */
    draw(submit: Submit, scene: Scene, camera: Camera)
    {
        const sLogic = logic(scene);
        const blenditems = sLogic.getPickCache(camera).blenditems;
        const unblenditems = sLogic.getPickCache(camera).unblenditems;

        // cameraUniforms 是响应式 computed（CameraLogic.uniforms），其 .value 依赖
        // viewMatrix/lens 等，相机变换变化时自动失效。bindingResources 持有同一 computed 引用，
        // 上游 WGPUBufferBinding 会重新读取 .value 并上传到 GPU。
        const cameraUniforms = logic(camera).uniforms;
        const ctime = (Date.now() / 1000) % 3600;
        const globalUniforms: GlobalUniforms = {
            u_sceneAmbientColor: scene.ambientColor,
            _Time: new Vector4(ctime / 20, ctime, ctime * 2, ctime * 3)
        };

        // 光源 uniform computed（按 scene 缓存，光源移动时自动重算）
        let lightsUniform = this._lightsUniformCache.get(scene);
        if (!lightsUniform)
        {
            lightsUniform = createLightsUniformComputed(scene);
            this._lightsUniformCache.set(scene, lightsUniform);
        }

        // 阴影数据（方向光）
        const dirLights = sLogic.activeDirectionalLights;
        const shadowLight = dirLights.find(l => l.shadowType && l.shadowType !== 0);
        let shadowDataValue: any = null;
        let shadowMapTexture: any = null;
        if (shadowLight)
        {
            const sLightLogic = logic(shadowLight);
            const shadowCam = shadowLight.shadowCamera;
            if (shadowCam)
            {
                const shadowCamLogic = logic(shadowCam);
                // 直接用 shadowCamera 的 viewProjection（与 ShadowRenderer 渲染阴影图所用完全一致），
                // 避免手动 world2local + lens.matrix 拼接因时序/缓存导致与阴影图不匹配。
                const shadowVP = shadowCamLogic.viewProjection;
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
                bindingResources.s_shadowMap = buildTextureView(shadowMapTexture || this.getPlaceholderShadowDepth());
                // 阴影采样器为比较采样器（sampler_comparison）：compare='less'
                // textureSampleCompare 比较 depth_ref < texel_depth：片元深度比存储的最近表面
                // 更近（没被遮挡）→ 1（照亮），否则 → 0（阴影）。这是标准阴影映射约定。
                // addressMode 用 clamp-to-edge：越界 uv 钳到边界（边界处深度=clearValue 1.0，
                // ref<1.0 → 照亮），避免 repeat 把阴影纹理另一侧的内容采到当前片元。
                const shadowSampler = buildSampler(shadowMapTexture || this.getPlaceholderShadowDepth());
                (shadowSampler as any).compare = 'less';
                (shadowSampler as any).addressModeU = 'clamp-to-edge';
                (shadowSampler as any).addressModeV = 'clamp-to-edge';
                bindingResources.s_shadowMapSampler = shadowSampler;
            }
            else
            {
                (bindingResources.cameraUniforms as any).value = cameraUniforms;
                (bindingResources.globalUniforms as any).value = globalUniforms;
                (bindingResources.lights as any).value = lightsUniform;
                (bindingResources.shadowData as any).value = shadowDataValue;
            }

            logic(renderable).beforeRender(renderObject, scene, camera);

            (((submit.commandEncoders[0].passEncoders[0] as RenderPass).renderPassObjects as RenderPassObject[])).push(renderObject);
        });
    }
}

/**
 * 前向渲染器
 */
export const forwardRenderer = new ForwardRenderer();
