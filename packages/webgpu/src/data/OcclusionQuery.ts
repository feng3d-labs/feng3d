import { RenderObject } from './RenderObject';

/**
 * 遮挡查询
 */
export interface OcclusionQuery
{
    /**
     * 数据类型。
     */
    readonly __type__: 'OcclusionQuery';

    /**
     * GPU渲染对象列表。
     */
    renderObjects: RenderObject[];

    /**
     * 查询结束回调。
     *
     * @param result 是否被渲染。true表示被渲染，false表示未被渲染。
     */
    onQuery?(result: number): void;
}
