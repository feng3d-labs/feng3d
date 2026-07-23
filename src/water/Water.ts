import { Renderable, renderableLogic } from '../core/Renderable';
import { Geometry } from '../geometry/Geometry';
import { Material } from '../materials/Material';
import { FrameBufferObject } from '../render/FrameBufferObject';
import { registerLogic, logic } from "@feng3d/reactivity";
import { RenderObject } from '@feng3d/webgpu';
import type { Camera } from '../cameras/Camera';
import type { Scene } from '../scene/Scene';
import { Color3 } from '@feng3d/math';
import type { RenderableLogic } from '../core/Renderable';
import { WaterUniforms } from './WaterMaterial';
import './Water';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        Water: Water;
    }
}

declare global
{
    export interface MixinsPrimitiveObject3D
    {
        Water: Water;
    }
}

/**
 * Water（纯数据接口）。
 */
export interface Water extends Renderable
{
    readonly __type__: 'Water';
    readonly geometry: Geometry;
    readonly material: Material;
    readonly frameBufferObject: FrameBufferObject;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Water: WaterLogic;
    }
}

/**
 * Water 逻辑处理接口。
 *
 * 组合 RenderableLogic，额外在 beforeRender 中写入水面 uniforms（太阳颜色/方向、时间）。
 * 原始镜像反射代码为死代码（if(1) return），保留现状未迁移。
 */
export interface WaterLogic extends RenderableLogic
{
}

/**
 * 创建 WaterLogic 实例（工厂函数，组合 renderableLogic 基础行为）。
 */
export function waterLogic(water: Water): WaterLogic
{
    const base = renderableLogic(water);

    // 捕获基类方法，避免覆盖后再调用 base.baseBeforeRender 导致递归
    const baseBaseBeforeRender = base.baseBeforeRender;

    return Object.assign(base, {
        beforeRender(renderObject: RenderObject, scene: Scene | null, camera: Camera | null): void
        {
            const uniforms = (water.material as unknown as { uniforms: WaterUniforms }).uniforms;
            const sun = logic(scene).activeDirectionalLights[0];
            if (sun)
            {
                uniforms.u_sunColor = sun.color as unknown as Color3;
                uniforms.u_sunDirection = logic(logic(sun).entity).local2world.getAxisZ().negate();
            }

            uniforms.u_time += 1.0 / 60.0;

            // 调用基类 beforeRender（geometry/material/lightPicker/transform/其他组件）
            baseBaseBeforeRender(renderObject, scene, camera);

            // 原始镜像反射代码为死代码（if(1) return 后），此处不迁移
        },
    }) as unknown as WaterLogic;
}
// 注册到 componentLogic 分发表
registerLogic('Water', waterLogic);
