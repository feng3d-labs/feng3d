import { Vector3, Vector4 } from '@feng3d/math';
import { BindingResource, RenderPass, RenderPassObject, Submit } from '@feng3d/webgpu';
import { logic } from '@feng3d/reactivity';
import type { Camera } from '../../cameras/Camera';
import type { Renderable } from '../../core/Renderable';
import type { Scene } from '../../scene/Scene';
import type { DirectionalLight } from '../../light/DirectionalLight';
import type { PointLight } from '../../light/PointLight';

/** 点光源最大数量（与 WGSL array<PointLightData, 8> 一致） */
const MAX_POINT_LIGHTS = 8;

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
    const dirIntensity = dirLight ? dirLight.intensity : 0;

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
                range: pl.range || 10,
                color: [pl.color.r, pl.color.g, pl.color.b],
                intensity: pl.intensity,
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
            color: [dirColor.r, dirColor.g, dirColor.b],
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

        // 光源 uniform（方向光 + 点光源）
        const lightsUniform = buildLightsUniform(scene);

        unblenditems.concat(blenditems).forEach((renderable) =>
        {
            // 绘制
            const renderObject = logic(renderable).renderObject.value;

            const bindingResources = renderObject.bindingResources as { [key: string]: BindingResource };

            // ---- 注入相机 / 全局 / 光源 uniform（按 WGSL 变量名键控） ----
            bindingResources.cameraUniforms = { value: cameraUniforms };
            bindingResources.globalUniforms = { value: globalUniforms };
            bindingResources.lights = { value: lightsUniform };

            logic(renderable).beforeRender(renderObject, scene, camera);

            (((submit.commandEncoders[0].passEncoders[0] as RenderPass).renderPassObjects as RenderPassObject[])).push(renderObject);
        });
    }
}

/**
 * 前向渲染器
 */
export const forwardRenderer = new ForwardRenderer();
