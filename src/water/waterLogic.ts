import { RenderObject } from '@feng3d/webgpu';
import { registerComponentLogic } from '../component/componentLogic';
import type { Camera } from '../cameras/Camera';
import type { Scene } from '../scene/Scene';
import { renderableLogic, RenderableLogic } from '../core/renderableLogic';
import { transformLogic } from '../core/transformLogic';
import { Water } from './Water';
import { WaterUniforms } from './WaterMaterial';
import { sceneLogic } from '../scene/sceneLogic';
import { lightLogic } from '../light/lightLogic';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Water: RenderableLogic;
    }
}

/**
 * Water 逻辑处理输出。
 *
 * 组合 renderableLogic，额外在 beforeRender 中写入水面 uniforms（太阳颜色/方向、时间）。
 * 原始镜像反射代码为死代码（if(1) return），保留现状未迁移。
 */
export function waterLogic(water: Water)
{
    const base = renderableLogic(water);

    return {
        ...base,
        beforeRender(renderObject: RenderObject, scene: Scene | null, camera: Camera | null)
        {
            const uniforms = water.material.uniforms as unknown as WaterUniforms;
            const sun = sceneLogic(scene).activeDirectionalLights[0];
            if (sun)
            {
                uniforms.u_sunColor = sun.color;
                uniforms.u_sunDirection = transformLogic(lightLogic(sun).object3D).local2world.value.getAxisZ().negate();
            }

            uniforms.u_time += 1.0 / 60.0;

            // 调用基类 beforeRender（geometry/material/lightPicker/transform/其他组件）
            base.baseBeforeRender(renderObject, scene, camera);

            // 原始镜像反射代码为死代码（if(1) return 后），此处不迁移
        },
    };
}

// 注册到 componentLogic 分发表
registerComponentLogic('Water', (component) =>
{
    return waterLogic(component as Water);
});
