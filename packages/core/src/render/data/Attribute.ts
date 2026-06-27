import { gPartial } from '@feng3d/polyfill';

/**
 * 顶点属性渲染数据。
 *
 * CPU 端的顶点属性数据容器。data 为 number[]（便于 concat/序列化），
 * 在 WebGPU 渲染路径下由 {@link render/webgpu/MaterialPipeline.buildVertexAttribute}
 * 转换为 webgpu 的 VertexAttribute（Float32Array + format）。
 *
 * 原属 @feng3d/renderer，已删除 GL buffer 缓存管理（active/getBuffer/clear）逻辑。
 */
export class Attribute
{
    /** 属性名（如 a_position）。 */
    name: string;

    /** 属性数据（每顶点的分量按顶点顺序排列）。 */
    get data()
    {
        return this._data;
    }
    set data(v)
    {
        this._data = v;
        this.invalidate();
    }
    private _data: number[];

    /**
     * 每个顶点的分量数（1~4）。
     */
    size = 3;

    /**
     * drawElementsInstanced 时用到的因子，表示 divisor 个 geometry 共用一个数据（实例化）。
     */
    divisor = 0;

    /** 是否已失效（脏标记，供序列化/边界计算等响应）。 */
    invalid = true;

    constructor(source?: gPartial<Attribute>)
    {
        Object.assign(this, source);
    }

    /** 标记数据失效。 */
    invalidate()
    {
        this.invalid = true;
    }
}
