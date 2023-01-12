import { Component3D } from '../../3d/Component3D';
import { Scene3D } from '../../3d/Scene3D';
import { RegisterComponent } from '../../ecs/Component';
import { Color4 } from '../../math/Color4';
import { oav } from '../../objectview/ObjectView';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Camera } from '../cameras/Camera';

declare module '../../ecs/Component' { interface ComponentMap { OutLine3D: OutLine3D; } }

declare module '../../renderer/data/Uniforms'
{
    interface Uniforms
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

/**
 * 描边。
 *
 * 由 OutlineRenderer 进行渲染。
 */
@RegisterComponent({ name: 'OutLine3D', menu: 'Rendering/OutLine3D' })
export class OutLine3D extends Component3D
{
    declare __class__: 'OutLine3D';

    @oav()
    @SerializeProperty()
    size = 1;

    @oav()
    @SerializeProperty()
    color = new Color4(0.2, 0.2, 0.2, 1.0);

    @oav()
    @SerializeProperty()
    outlineMorphFactor = 0.0;

    beforeRender(renderAtomic: RenderAtomic, _scene: Scene3D, _camera: Camera)
    {
        renderAtomic.uniforms.u_outlineSize = this.size;
        renderAtomic.uniforms.u_outlineColor = this.color;
        renderAtomic.uniforms.u_outlineMorphFactor = this.outlineMorphFactor;
    }
}
