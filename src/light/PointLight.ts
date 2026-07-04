import { oav } from '@feng3d/objectview';
import { reactive } from '@feng3d/reactivity';
import { serialize } from '@feng3d/serialization';
import { RegisterComponent } from '../component/Component';
import { Object3D } from '../core/Object3D';
import { createPrimitive, registerPrimitive } from '../core/object3DLogic';
import { AddComponentMenu } from '../Menu';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { Light } from './Light';
import { LightType } from './LightType';

// 触发 pointLightLogic 注册到 componentLogic 分发表
import './pointLightLogic';
export { pointLightLogic } from './pointLightLogic';
export type { PointLightLogic } from './pointLightLogic';

declare global
{
    export interface MixinsComponentMap
    {
        PointLight: PointLight;
    }

    export interface MixinsPrimitiveObject3D
    {
        'Point Light': Object3D;
    }
}

/**
 * 点光源（纯数据）。
 *
 * 光照范围与阴影相机同步逻辑由 {@link pointLightLogic} 提供。
 */
@AddComponentMenu('Rendering/PointLight')
@RegisterComponent()
export class PointLight extends Light
{
    __class__: 'PointLight';

    lightType = LightType.Point;

    /**
     * 光照范围
     */
    @oav()
    @serialize
    range = 10;
}

registerPrimitive('Point Light', (g) =>
{
    const c = new PointLight();
    reactive(g).components.push(c);
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'Light/Point Light',
        priority: -1,
        click: () =>
            createPrimitive('Point Light')
    }
);
