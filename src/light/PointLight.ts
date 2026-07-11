import { Light, createLight } from './Light';
import { LightType } from './LightType';
import { registerLogic, logic as getLogic, effect, reactive } from "@feng3d/reactivity";
import { Vector2 } from '@feng3d/math';
import { PerspectiveLens } from '../cameras/lenses/PerspectiveLens';
import type { Object3D } from '../core/Object3D';
import { LightLogic } from './Light';

import './PointLight';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        PointLight: PointLight;
    }
}

/**
 * PointLight（纯数据接口）。
 */
export interface PointLight extends Light
{
    readonly __type__: 'PointLight';
    readonly lightType: any;
    readonly range: number;
}

/**
 * 创建 PointLight 实例。
 */
export function createPointLight(): PointLight
{
    return {
        ...createLight(), __type__: 'PointLight',
        lightType: LightType.Point,
        range: 10,
    };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        PointLight: PointLightLogic;
    }
}

/**
 * PointLight 逻辑处理类。
 *
 * 继承 LightLogic，额外：
 * - init: 设置 shadowCamera.lens 为 90 度 PerspectiveLens
 * - effect 监听 range 变化时更新 lens.far
 * - shadowMapSize 覆盖（1/4, 1/2）
 */
export class PointLightLogic extends LightLogic
{
    private _perspectiveLens: PerspectiveLens | null = null;
    private _pointInited = false;

    constructor(light: PointLight)
    {
        super(light);
    }

    get shadowMapSize(): any
    {
        return this.shadowMap.getSize().multiply(new Vector2(1 / 4, 1 / 2));
    }

    init(object3D?: Object3D): void
    {
        if (this._pointInited) return;
        this._pointInited = true;
        super.init(object3D);

        const light = this.component as PointLight;

        this._perspectiveLens = new PerspectiveLens(90, 1, 0.1, light.range);
        light.shadowCamera.lens = this._perspectiveLens;

        // effect 监听 range 变化时更新 lens.far
        effect(() =>
        {
            const range = reactive(light).range;
            if (this._perspectiveLens)
            {
                this._perspectiveLens.far = range;
            }
        });
    }
}
// 注册到 componentLogic 分发表
registerLogic('PointLight', (component) =>
{
    return new PointLightLogic(component as PointLight);
});
