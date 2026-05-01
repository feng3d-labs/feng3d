import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { Camera } from '../cameras/Camera';
import { AddComponentMenu } from '../Menu';
import { Scene } from '../scene/Scene';
import { RegisterComponent, Component } from './Component';
import { RenderObject } from '@feng3d/webgpu';

declare global
{
    export interface MixinsComponentMap
    {
        OutLineComponent: OutLineComponent;
    }

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
@RegisterComponent()
@decoratorRegisterClass()
export class OutLineComponent extends Component
{
    __class__: 'OutLineComponent';

    @oav()
    @serialize
    size = 1;

    @oav()
    @serialize
    color = new Color4(0.2, 0.2, 0.2, 1.0);

    @oav()
    @serialize
    outlineMorphFactor = 0.0;

    beforeRender(renderObject: RenderObject, _scene: Scene, _camera: Camera)
    {
        renderObject.uniforms.u_outlineSize = this.size;
        renderObject.uniforms.u_outlineColor = this.color;
        renderObject.uniforms.u_outlineMorphFactor = this.outlineMorphFactor;
    }
}
