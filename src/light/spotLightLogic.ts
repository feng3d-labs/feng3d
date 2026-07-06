import { logic } from '@feng3d/reactivity';
import { effect, reactive } from '@feng3d/reactivity';
import { PerspectiveLens } from '../cameras/lenses/PerspectiveLens';
import { mathUtil } from '@feng3d/polyfill';
import { registerComponentLogic } from '../component/componentLogic';
import { lightLogic, LightLogic } from './lightLogic';
import { SpotLight } from './SpotLight';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SpotLight: SpotLightLogic;
    }
}

/**
 * SpotLight 逻辑处理输出。
 *
 * 组合 lightLogic，额外：
 * - init: 设置 shadowCamera.lens 为 PerspectiveLens(angle, ...)
 * - effect 监听 angle 变化时更新 lens.fov
 * - effect 监听 range 变化时更新 lens.far
 * - coneCos / penumbraCos 派生
 */
export interface SpotLightLogic extends LightLogic
{
    readonly coneCos: number;
    readonly penumbraCos: number;
}


/**
 * 获取 SpotLight 的 logic。
 */
export function spotLightLogic(light: SpotLight): SpotLightLogic

{
    return logic(light);
}

function createSpotLightLogic(light: SpotLight): SpotLightLogic
{
    const base = lightLogic(light);
    let _perspectiveLens: PerspectiveLens | null = null;
    let _inited = false;

    const logic: SpotLightLogic = {
        ...base,
        get coneCos()
        {
            return Math.cos(light.angle * 0.5 * mathUtil.DEG2RAD);
        },
        get penumbraCos()
        {
            return Math.cos(light.angle * 0.5 * mathUtil.DEG2RAD * (1 - light.penumbra));
        },
        init()
        {
            if (_inited) return;
            _inited = true;
            base.init();

            _perspectiveLens = new PerspectiveLens(light.angle, 1, 0.1, light.range);
            light.shadowCamera.lens = _perspectiveLens;

            // effect 监听 angle 变化时更新 lens.fov
            effect(() =>
            {
                const angle = reactive(light).angle;
                if (_perspectiveLens)
                {
                    _perspectiveLens.fov = angle;
                }
            });

            // effect 监听 range 变化时更新 lens.far
            effect(() =>
            {
                const range = reactive(light).range;
                if (_perspectiveLens)
                {
                    _perspectiveLens.far = range;
                }
            });
        },
    };

    return logic;
}

// 注册到 componentLogic 分发表
registerComponentLogic('SpotLight', (component) =>
{
    return createSpotLightLogic(component as SpotLight);
});
