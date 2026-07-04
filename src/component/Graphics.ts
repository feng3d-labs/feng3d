import { decoratorRegisterClass } from '@feng3d/polyfill';
import { Component } from './Component';

// 触发 graphicsLogic 注册到 componentLogic 分发表
import './graphicsLogic';

/**
 * Graphics（纯数据）。
 *
 * 矢量图形绘制逻辑（canvas/context2D 创建、draw）由 {@link graphicsLogic} 提供。
 */
@decoratorRegisterClass()
export class Graphics extends Component
{
    __class__: 'Graphics';
}
