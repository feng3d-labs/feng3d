import { RegisterComponent } from '../../ecs/Component';
import { Color4 } from '../../math/Color4';
import { Vector4 } from '../../math/geom/Vector4';
import { oav } from '../../objectview/ObjectView';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Camera3D } from '../cameras/Camera3D';
import { Component3D } from '../core/Component3D';
import { Scene3D } from '../core/Scene3D';

declare module '../../ecs/Component' { interface ComponentMap { Cartoon3D: Cartoon3D; } }

declare module '../../renderer/data/Uniforms'
{
    interface Uniforms
    {
        u_diffuseSegment: Vector4;
        u_diffuseSegmentValue: Vector4;

        u_specularSegment: number;
    }
}

/**
 * 参考
 */
@RegisterComponent({ name: 'Cartoon3D', menu: 'Rendering/Cartoon3D' })
export class Cartoon3D extends Component3D
{
    declare __class__: 'Cartoon3D';

    @oav()
    @SerializeProperty()
    outlineSize = 1;

    @oav()
    @SerializeProperty()
    outlineColor = new Color4(0.2, 0.2, 0.2, 1.0);

    @oav()
    @SerializeProperty()
    outlineMorphFactor = 0.0;

    /**
     * 半兰伯特值diff，分段值 4个(0.0,1.0)
     */
    @oav()
    @SerializeProperty()
    diffuseSegment = new Vector4(0.1, 0.3, 0.6, 1.0);
    /**
     * 半兰伯特值diff，替换分段值 4个(0.0,1.0)
     */
    @oav()
    @SerializeProperty()
    diffuseSegmentValue = new Vector4(0.1, 0.3, 0.6, 1.0);

    @oav()
    @SerializeProperty()
    specularSegment = 0.5;

    @oav()
    @SerializeProperty()
    get cartoon_Anti_aliasing()
    {
        return this._cartoon_Anti_aliasing;
    }
    set cartoon_Anti_aliasing(value)
    {
        this._cartoon_Anti_aliasing = value;
    }
    _cartoon_Anti_aliasing = false;

    beforeRender(renderAtomic: RenderAtomic, _scene: Scene3D, _camera: Camera3D)
    {
        renderAtomic.uniforms.u_diffuseSegment = this.diffuseSegment;
        renderAtomic.uniforms.u_diffuseSegmentValue = this.diffuseSegmentValue;
        renderAtomic.uniforms.u_specularSegment = this.specularSegment;
        //
        renderAtomic.uniforms.u_outlineSize = this.outlineSize;
        renderAtomic.uniforms.u_outlineColor = this.outlineColor;
        renderAtomic.uniforms.u_outlineMorphFactor = this.outlineMorphFactor;
    }
}
