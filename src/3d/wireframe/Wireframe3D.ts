import { RegisterComponent } from '../../ecs/Component';
import { Color4 } from '../../math/Color4';
import { oav } from '../../objectview/ObjectView';
import { Component3D } from '../core/Component3D';

declare module '../../ecs/Component' { interface ComponentMap { Wireframe3D: Wireframe3D; } }

/**
 * 线框组件，将会对拥有该组件的对象绘制线框
 *
 * 由 WireframeRenderer 负责渲染。
 */
@RegisterComponent({ name: 'Wireframe3D' })
export class Wireframe3D extends Component3D
{
    declare __class__: 'Wireframe3D';

    @oav()
    color = new Color4(125 / 255, 176 / 255, 250 / 255);
}
