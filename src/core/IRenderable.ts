import { RenderAtomic } from '../../renderer/data/RenderAtomic';

/**
 * 可渲染接口
 */
export interface IRenderable
{
    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     */
    readonly renderAtomic: RenderAtomic;
}
