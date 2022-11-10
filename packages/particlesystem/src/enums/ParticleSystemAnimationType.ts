/**
 * The animation type.
 *
 * 动画类型。
 */
export enum ParticleSystemAnimationType
{
    /**
     * Animate over the whole texture sheet from left to right, top to bottom.
     *
     * 从左到右，从上到下动画整个纹理表。
     */
    WholeSheet = 0,
    /**
     * Animate a single row in the sheet from left to right.
     *
     * 从左到右移动工作表中的一行。
     */
    SingleRow = 1,
}
