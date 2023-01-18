import { createNodeMenu } from '../../core/CreateNodeMenu';
import { RegisterComponent } from '../../ecs/Component';
import { Node3D } from '../core/Node3D';
import { Light3D } from './Light3D';
import { LightType } from './LightType';

declare module '../../ecs/Component' { interface ComponentMap { DirectionalLight3D: DirectionalLight3D; } }

declare module '../core/Node3D' { interface PrimitiveNode3D { 'Directional light': Node3D; } }

/**
 * 方向光源
 */
@RegisterComponent({ name: 'DirectionalLight3D', menu: 'Rendering/DirectionalLight3D' })
export class DirectionalLight3D extends Light3D
{
    declare __class__: 'DirectionalLight3D';

    lightType = LightType.Directional;
}

Node3D.registerPrimitive('Directional light', (g) =>
{
    g.addComponent('DirectionalLight3D');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'Light/Directional light',
        priority: -2,
        click: () =>
            Node3D.createPrimitive('Directional light')
    }
);

