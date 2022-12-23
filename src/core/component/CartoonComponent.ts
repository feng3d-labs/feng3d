import { Color4 } from '../../math/Color4';
import { Vector4 } from '../../math/geom/Vector4';
import { oav } from '../../objectview/ObjectView';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { Serializable } from '../../serialization/Serializable';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Camera } from '../cameras/Camera';
import { AddComponentMenu } from '../Menu';
import { Scene } from '../scene/Scene';
import { Component, RegisterComponent } from './Component';

declare global
{
    export interface MixinsComponentMap
    {
        CartoonComponent: CartoonComponent;
    }

    export interface MixinsUniforms
    {
        u_diffuseSegment: Vector4;
        u_diffuseSegmentValue: Vector4;

        u_specularSegment: number;
    }

}

/**
 * 参考
 */
@AddComponentMenu('Rendering/CartoonComponent')
@RegisterComponent()
@Serializable()
export class CartoonComponent extends Component
{
    __class__: 'CartoonComponent';

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

    beforeRender(renderAtomic: RenderAtomic, _scene: Scene, _camera: Camera)
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
