import { Color4 } from '../../math/Color4';
import { oav } from '../../objectview/ObjectView';
import { Serializable } from '../../serialization/Serializable';
import { RegisterComponent, Component } from '../../ecs/Component';

declare global
{
    export interface MixinsComponentMap
    {
        WireframeComponent: WireframeComponent;
    }
}

/**
 * 线框组件，将会对拥有该组件的对象绘制线框
 */
@RegisterComponent({ name: 'WireframeComponent' })
@Serializable('WireframeComponent')
export class WireframeComponent extends Component
{
    declare __class__: 'WireframeComponent';

    @oav()
    color = new Color4(125 / 255, 176 / 255, 250 / 255);
}
