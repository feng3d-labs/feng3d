import { RegisterComponent } from '@feng3d/ecs';
import { oav } from '@feng3d/objectview';
import { SerializeProperty } from '@feng3d/serialization';
import { createNodeMenu } from '../../core/CreateNodeMenu';
import { Node3D } from '../core/Node3D';
import { Light3D } from './Light3D';
import { LightType } from './LightType';

declare module '@feng3d/ecs' { interface ComponentMap { PointLight3D: PointLight3D; } }

declare module '../core/Node3D' { interface PrimitiveNode3D { 'Point Light': Node3D; } }

/**
 * 点光源
 */
@RegisterComponent({ name: 'PointLight3D', menu: 'Rendering/PointLight' })
export class PointLight3D extends Light3D
{
    declare __class__: 'PointLight3D';

    lightType = LightType.Point;

    /**
     * 光照范围
     */
    @oav()
    @SerializeProperty()
    range = 10;
}

Node3D.registerPrimitive('Point Light', (g) =>
{
    g.addComponent('PointLight3D');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'Light/Point Light',
        priority: -1,
        click: () =>
            Node3D.createPrimitive('Point Light')
    }
);

