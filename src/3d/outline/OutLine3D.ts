import { RegisterComponent } from '@feng3d/ecs';
import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { RenderAtomic } from '@feng3d/renderer';
import { SerializeProperty } from '@feng3d/serialization';

import { Camera3D } from '../cameras/Camera3D';
import { Component3D } from '../core/Component3D';
import { Scene3D } from '../core/Scene3D';

declare module '@feng3d/ecs' { interface ComponentMap { OutLine3D: OutLine3D; } }

declare module '@feng3d/renderer'
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

    beforeRender(renderAtomic: RenderAtomic, _scene: Scene3D, _camera: Camera3D)
    {
        renderAtomic.uniforms.u_outlineSize = this.size;
        renderAtomic.uniforms.u_outlineColor = this.color;
        renderAtomic.uniforms.u_outlineMorphFactor = this.outlineMorphFactor;
    }
}
