/**
 * 视窗。
 *
 * 包含以下限制。
 * * x ≥ 0
 * * y ≥ 0
 * * width ≥ 0
 * * height ≥ 0
 * * x + width ≤ this.[[attachment_size]].width
 * * y + height ≤ this.[[attachment_size]].height
 * * 0.0 ≤ minDepth ≤ 1.0
 * * 0.0 ≤ maxDepth ≤ 1.0
 * * minDepth ≤ maxDepth
 *
 * @see https://gpuweb.github.io/gpuweb/#dom-gpurenderpassencoder-setviewport
 *
 */
export interface Viewport
{
    /**
     * 是否为Y轴朝上。
     *
     * 默认为 ture。
     */
    isYup?: boolean;

    /**
     * 视窗水平坐标（像素）。
     *
     * x ≥ 0
     *
     * 默认为 0 。
     */
    x?: number;

    /**
     * 视窗垂直坐标（像素）。
     *
     * y ≥ 0
     *
     * 默认为 0 。
     */
    y?: number;

    /**
     * 视窗宽度（像素）。
     *
     * width ≥ 0
     *
     * 默认为画布宽度或者渲染通道的附件宽度。
     */
    width: number;

    /**
     * 视窗高度（像素）。
     *
     * height ≥ 0
     *
     * 默认为画布高度或者渲染通道的附件高度。
     */
    height: number;

    /**
     * Minimum depth value of the viewport.
     *
     * 0.0 ≤ minDepth ≤ 1.0 并且 minDepth ≤ maxDepth
     *
     * 默认为 0 。
     */
    minDepth?: number;

    /**
     * Maximum depth value of the viewport.
     *
     * 0.0 ≤ maxDepth ≤ 1.0 并且 minDepth ≤ maxDepth
     *
     * 默认为 1 。
     */
    maxDepth?: number;
}
