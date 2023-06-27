import { mathUtil } from '@feng3d/polyfill';
import { createNodeMenu } from '../../core/CreateNodeMenu';
import { RegisterComponent } from '../../ecs/Component';
import { oav } from '@feng3d/objectview';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Node3D } from '../core/Node3D';
import { Light3D } from './Light3D';
import { LightType } from './LightType';

declare module '../../ecs/Component' { interface ComponentMap { SpotLight3D: SpotLight3D; } }
declare module '../core/Node3D' { interface PrimitiveNode3D { 'Spot Light': Node3D; } }

/**
 * 聚光灯光源
 */
@RegisterComponent({ name: 'SpotLight3D' })
export class SpotLight3D extends Light3D
{
    lightType = LightType.Spot;

    /**
     * 光照范围
     */
    @oav()
    @SerializeProperty()
    range = 10;

    /**
     *
     */
    @oav()
    @SerializeProperty()
    angle = 60;

    /**
     * 半影.
     */
    @oav()
    @SerializeProperty()
    penumbra = 0;

    /**
     * 椎体cos值
     */
    get coneCos()
    {
        return Math.cos(this.angle * 0.5 * mathUtil.DEG2RAD);
    }

    get penumbraCos()
    {
        return Math.cos(this.angle * 0.5 * mathUtil.DEG2RAD * (1 - this.penumbra));
    }
}

Node3D.registerPrimitive('Spot Light', (g) =>
{
    g.addComponent('SpotLight3D');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'Light/Spot Light',
        priority: -2,
        click: () =>
            Node3D.createPrimitive('Spot Light')
    }
);

