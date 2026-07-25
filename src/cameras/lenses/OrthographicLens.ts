import { effect, reactive } from '@feng3d/reactivity';
import { Projection } from '../Projection';
import { LensBase } from './LensBase';

/**
 * 正射投影镜头
 *
 * 使用非对称的 left/right/top/bottom 定义可视范围，
 * 可严丝合缝地把任意包围盒映射到 [-1,1]（阴影等场景精度最高）。
 */
export class OrthographicLens extends LensBase
{
    /**
     * 可视空间左边界
     */
    left: number;

    /**
     * 可视空间右边界
     */
    right: number;

    /**
     * 可视空间上边界
     */
    top: number;

    /**
     * 可视空间下边界
     */
    bottom: number;

    /**
     * 构建正射投影镜头
     * @param left 可视空间左边界
     * @param right 可视空间右边界
     * @param top 可视空间上边界
     * @param bottom 可视空间下边界
     * @param near 可视空间近边界
     * @param far 可视空间远边界
     */
    constructor(left = -1, right = 1, top = 1, bottom = -1, near = 0.3, far = 1000)
    {
        super(1, near, far);
        this._projectionType = Projection.Orthographic;
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
        // 监听 left/right/top/bottom 变化使投影矩阵失效（响应式替代 watcher.watch）
        effect(() =>
        {
            const r_lens = reactive(this as OrthographicLens);
            r_lens.left;
            r_lens.right;
            r_lens.top;
            r_lens.bottom;
            this.invalidate();
        });
    }

    protected _updateMatrix()
    {
        this._matrix.setOrtho(this.left, this.right, this.top, this.bottom, this.near, this.far);
    }

    clone()
    {
        return new OrthographicLens(this.left, this.right, this.top, this.bottom, this.near, this.far);
    }
}
