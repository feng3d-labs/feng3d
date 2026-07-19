import { gPartial } from '@feng3d/polyfill';

/**
 * 顶点索引渲染数据。
 *
 * CPU 端的索引数据容器，indices 为 number[]。在 WebGPU 渲染路径下由
 * {@link GeometryLogic.beforeRender} 转换为 Uint16Array/Uint32Array。
 *
 * 原属 @feng3d/renderer，已删除 GL buffer 缓存管理逻辑。
 */
export class Index
{
    /** 索引数据。 */
    get indices()
    {
        return this._indices;
    }
    set indices(v)
    {
        this._indices = v;
        this.invalidate();
    }
    private _indices: number[];

    constructor(source?: gPartial<Index>)
    {
        Object.assign(this, source);
    }

    /** 渲染数量。 */
    get count()
    {
        if (!this.indices)
        {
            return 0;
        }

        return this.indices.length;
    }

    /** 是否已失效。 */
    private _invalid = true;

    /** 标记失效。 */
    invalidate()
    {
        this._invalid = true;
    }
}
