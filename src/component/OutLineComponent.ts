import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { AddComponentMenu } from '../Menu';
import { RegisterComponent, Component } from './Component';

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

/**
 * 描边组件（纯数据）。
 *
 * 描边相关 uniform 由 material 注入，无需 beforeRender。
 * 默认 componentLogic（空 init/beforeRender/dispose）即可。
 */
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
}
