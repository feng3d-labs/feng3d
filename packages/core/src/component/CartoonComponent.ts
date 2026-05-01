import { Color4, Vector4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { Camera } from '../cameras/Camera';
import { AddComponentMenu } from '../Menu';
import { Scene } from '../scene/Scene';
import { Component, RegisterComponent } from './Component';
import { RenderObject } from '@feng3d/webgpu';

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
@decoratorRegisterClass()
export class CartoonComponent extends Component
{
    __class__: 'CartoonComponent';

    @oav()
    @serialize
    outlineSize = 1;

    @oav()
    @serialize
    outlineColor = new Color4(0.2, 0.2, 0.2, 1.0);

    @oav()
    @serialize
    outlineMorphFactor = 0.0;

    /**
     * 半兰伯特值diff，分段值 4个(0.0,1.0)
     */
    @oav()
    @serialize
    diffuseSegment = new Vector4(0.1, 0.3, 0.6, 1.0);
    /**
     * 半兰伯特值diff，替换分段值 4个(0.0,1.0)
     */
    @oav()
    @serialize
    diffuseSegmentValue = new Vector4(0.1, 0.3, 0.6, 1.0);

    @oav()
    @serialize
    specularSegment = 0.5;

    @oav()
    @serialize
    get cartoon_Anti_aliasing()
    {
        return this._cartoon_Anti_aliasing;
    }
    set cartoon_Anti_aliasing(value)
    {
        this._cartoon_Anti_aliasing = value;
    }
    _cartoon_Anti_aliasing = false;

    beforeRender(renderObject: RenderObject, _scene: Scene, _camera: Camera)
    {
        renderObject.uniforms.u_diffuseSegment = this.diffuseSegment;
        renderObject.uniforms.u_diffuseSegmentValue = this.diffuseSegmentValue;
        renderObject.uniforms.u_specularSegment = this.specularSegment;
        //
        renderObject.uniforms.u_outlineSize = this.outlineSize;
        renderObject.uniforms.u_outlineColor = this.outlineColor;
        renderObject.uniforms.u_outlineMorphFactor = this.outlineMorphFactor;
    }
}
