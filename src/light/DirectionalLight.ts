import { decoratorRegisterClass } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import { Light } from './Light';
import { LightType } from './LightType';
;
import { createPrimitive, registerPrimitive } from '../core/object3DLogic';
import { AddComponentMenu } from '../Menu';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { Object3D } from '../core/Object3D';

// 触发 directionalLightLogic 注册到 componentLogic 分发表
import './directionalLightLogic';
export { directionalLightLogic } from './directionalLightLogic';
export type { DirectionalLightLogic } from './directionalLightLogic';

declare global
{
    export interface MixinsPrimitiveObject3D
    {
        DirectionalLight: Object3D;
    }
}

/**
 * 平行光（纯数据）。
 *
 * 阴影相机更新逻辑由 {@link directionalLightLogic} 提供。
 */
@AddComponentMenu('Light/DirectionalLight')
@decoratorRegisterClass()
export class DirectionalLight extends Light
{
    readonly __type__: string = 'DirectionalLight';

    __class__: 'DirectionalLight';

    lightType = LightType.Directional;
}

registerPrimitive('DirectionalLight', (g) =>
{
    const c = new DirectionalLight();
    reactive(g).components.push(c);
});

createNodeMenu.push(
    {
        path: 'Light/Directional Light',
        click: () =>
            createPrimitive('DirectionalLight')
    },
);
