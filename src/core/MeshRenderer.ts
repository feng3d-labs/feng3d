import { decoratorRegisterClass } from '@feng3d/polyfill';
;
import { Renderable } from './Renderable';

// 触发 meshRendererLogic 注册到 componentLogic 分发表
import './meshRendererLogic';

/**
 * 网格渲染器（纯数据）。
 *
 * 渲染逻辑由 {@link meshRendererLogic}（复用 renderableLogic）提供。
 */
@decoratorRegisterClass()
export class MeshRenderer extends Renderable
{
    readonly __type__: string = 'MeshRenderer';

    __class__: 'MeshRenderer';
}
