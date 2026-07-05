import { oav } from '@feng3d/objectview';
import { reactive } from '@feng3d/reactivity';
import { serialize } from '@feng3d/serialization';
;
import { Object3D } from '../core/Object3D';
import { createPrimitive, registerPrimitive } from '../core/object3DLogic';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { Light } from './Light';
import { LightType } from './LightType';

// 触发 spotLightLogic 注册到 componentLogic 分发表
import './spotLightLogic';
export { spotLightLogic } from './spotLightLogic';
export type { SpotLightLogic } from './spotLightLogic';

declare global
{
    export interface MixinsPrimitiveObject3D
    {
        'Spot Light': Object3D;
    }
}

/**
 * 聚光灯光源（纯数据）。
 *
 * 锥体角度/范围与阴影相机同步逻辑由 {@link spotLightLogic} 提供。
 */
export class SpotLight extends Light
{
    readonly __type__: string = 'SpotLight';

    lightType = LightType.Spot;

    /**
     * 光照范围
     */
    @oav()
    @serialize
    range = 10;

    /**
     * 锥角
     */
    @oav()
    @serialize
    angle = 60;

    /**
     * 半影
     */
    @oav()
    @serialize
    penumbra = 0;
}

registerPrimitive('Spot Light', (g) =>
{
    const c = new SpotLight();
    reactive(g).components.push(c);
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'Light/Spot Light',
        priority: -2,
        click: () =>
            createPrimitive('Spot Light')
    }
);
