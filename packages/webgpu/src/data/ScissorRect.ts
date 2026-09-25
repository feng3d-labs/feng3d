/**
 * 剪刀盒。
 *
 * 设置了一个剪刀盒，它将绘图限制为一个指定的矩形。
 *
 * Sets the scissor rectangle used during the rasterization stage. After transformation into viewport coordinates any fragments which fall outside the scissor rectangle will be discarded.
 *
 * 光栅化阶段中使用的剪刀矩形。
 *
 * 需要满足以下条件。
 * * x+width ≤ this.[[attachment_size]].width.
 * * y+height ≤ this.[[attachment_size]].height.
 *
 * @see https://www.orillusion.com/zh/webgpu.html#dom-gpurenderpassencoder-setscissorrect
 *
 */
export interface ScissorRect
{
    /**
     * 是否为Y轴朝上。
     *
     * 默认为 ture。
     */
    readonly isYup?: boolean;

    /**
     * 剪刀盒横向坐标（像素）。
     *
     * x ≥ 0
     *
     * 默认为 0 。
     */
    readonly x?: number;

    /**
     * 剪刀盒纵向坐标（像素）。
     *
     * y ≥ 0
     *
     * 默认为 0 。
     */
    readonly y?: number;

    /**
     * 剪刀盒宽度（像素）。
     *
     * width ≥ 0
     *
     * 默认为画布宽度或者渲染通道的附件宽度。
     */
    readonly width: number;

    /**
     * 剪刀盒高度（像素）。
     *
     * height ≥ 0
     *
     * 默认为画布高度或者渲染通道的附件高度。
     */
    readonly height: number;
}
