import { Color4 } from '../../math/Color4';
import { oav } from '../../objectview/ObjectView';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { Serializable } from '../../serialization/Serializable';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Camera } from '../cameras/Camera';
import { AddComponentMenu } from '../Menu';
import { Scene } from '../scene/Scene';
import { RegisterComponent, Component } from '../../ecs/Component';

declare module '../../ecs/Component'
{
    interface ComponentMap
    {
        OutLineComponent: OutLineComponent;
    }
}

declare global
{
    export interface MixinsUniforms
    {
        /**
         * 描边宽度
         */
        u_outlineSize: number;
        /**
         * 描边颜色
         */
        u_outlineColor: Color4;
        /**
         * 描边形态因子
         * (0.0，1.0):0.0表示延法线方向，1.0表示延顶点方向
         */
        u_outlineMorphFactor: number;
    }
}

@AddComponentMenu('Rendering/OutLineComponent')
@RegisterComponent({ name: 'OutLineComponent' })
@Serializable('OutLineComponent')
export class OutLineComponent extends Component
{
    declare __class__: 'OutLineComponent';

    @oav()
    @SerializeProperty()
    size = 1;

    @oav()
    @SerializeProperty()
    color = new Color4(0.2, 0.2, 0.2, 1.0);

    @oav()
    @SerializeProperty()
    outlineMorphFactor = 0.0;

    beforeRender(renderAtomic: RenderAtomic, _scene: Scene, _camera: Camera)
    {
        renderAtomic.uniforms.u_outlineSize = this.size;
        renderAtomic.uniforms.u_outlineColor = this.color;
        renderAtomic.uniforms.u_outlineMorphFactor = this.outlineMorphFactor;
    }
}
