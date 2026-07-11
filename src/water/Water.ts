import { Renderable, createRenderable } from '../core/Renderable';
import { Geometry } from '../geometry/Geometry';
import { getDefaultGeometry } from '../geometry/Geometry';
import { getDefaultMaterial } from '../materials/Material';
import { FrameBufferObject } from '../render/FrameBufferObject';
import { registerLogic, logic } from "@feng3d/reactivity";
import { RenderObject } from '@feng3d/webgpu';
import type { Camera } from '../cameras/Camera';
import type { Scene } from '../scene/Scene';
import { RenderableLogic } from '../core/Renderable';
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
        Water: any;
    }
}

/**
 * Water（纯数据接口）。
 */
export interface Water extends Renderable
{
    readonly __type__: 'Water';
    readonly geometry: any;
    readonly material: any;
    readonly frameBufferObject: FrameBufferObject;
}

/**
 * 创建 Water 实例。
 */
export function createWater(): Water
{
    return {
        ...createRenderable(), __type__: 'Water',
        geometry: getDefaultGeometry('Plane'),
        material: getDefaultMaterial('Water-Material'),
        frameBufferObject: new FrameBufferObject(),
    };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Water: WaterLogic;
    }
}

/**
 * Water 逻辑处理类。
 *
 * 继承 RenderableLogic，额外在 beforeRender 中写入水面 uniforms（太阳颜色/方向、时间）。
 * 原始镜像反射代码为死代码（if(1) return），保留现状未迁移。
 */
export class WaterLogic extends RenderableLogic
{
    constructor(water: Water)
    {
        super(water);
    }

    beforeRender(renderObject: RenderObject, scene: Scene | null, camera: Camera | null): void
    {
        const water = this.component as Water;
        const uniforms = water.material.uniforms as unknown as WaterUniforms;
        const sun = logic(scene).activeDirectionalLights[0];
        if (sun)
        {
            uniforms.u_sunColor = sun.color;
            uniforms.u_sunDirection = logic(logic(sun).object3D).local2world.value.getAxisZ().negate();
        }

        uniforms.u_time += 1.0 / 60.0;

        // 调用基类 beforeRender（geometry/material/lightPicker/transform/其他组件）
        super.baseBeforeRender(renderObject, scene, camera);

        // 原始镜像反射代码为死代码（if(1) return 后），此处不迁移
    }
}
// 注册到 componentLogic 分发表
registerLogic('Water', (component) =>
{
    return new WaterLogic(component as Water);
});
