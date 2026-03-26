export interface VectorLike
{
}

/**
 * 向量
 */
export interface Vector
{
    /**
     * 将另一个点的坐标添加到此点的坐标。
     * @param v 要添加的点。
     */
    add(v: VectorLike): Vector;

    /**
     * 将另一个点的坐标添加到此点的坐标以创建一个新点。
     * @param v 要添加的点。
     * @param vOut 用于接收计算结果。
     * @returns 新点。
     */
    addTo(v: VectorLike, vOut?: Vector): Vector;

    /**
     * 从此点的坐标中减去另一个点的坐标。
     * @param v 要减去的点。
     */
    sub(v: VectorLike): Vector;

    /**
     * 从此点的坐标中减去另一个点的坐标以创建一个新点。
     * @param v 要减去的点。
     * @param vOut 用于接收计算结果。
     * @returns 新点。
     */
    subTo(v: VectorLike, vOut?: Vector): Vector;

    /**
     * 乘以向量
     * @param v 向量
     */
    multiply(v: VectorLike): this;

    /**
     * 乘以向量
     * @param v 向量
     * @param vOut 输出向量
     */
    multiplyTo(v: VectorLike, vOut?: Vector): Vector;

    /**
     * 除以向量
     * @param v 向量
     */
    divide(v: VectorLike): this;

    /**
     * 除以向量
     * @param v 向量
     * @param vOut 输出向量
     */
    divideTo(v: VectorLike, vOut?: Vector): Vector;

    /**
     * 确定两个向量是否相同。如果两个向量具有相同的分量值，则它们是相同的向量。
     * @param toCompare 要比较的向量。
     * @returns 如果该对象与此 向量 对象相同，则为 true 值，如果不相同，则为 false。
     */
    equals(toCompare: VectorLike, precision?: number): boolean;

    /**
     * 将源 Vector 对象中的所有点数据复制到调用方 Vector 对象中。
     * @param source 要从中复制数据的 Vector 对象。
     */
    copy(source: VectorLike): Vector;

    /**
     * 与目标点之间的距离
     * @param p 目标点
     */
    distance(p: VectorLike): number;

    /**
     * 与目标点之间的距离平方
     * @param p 目标点
     */
    distanceSquared(p: VectorLike): number;

    /**
     * 将 (0,0) 和当前点之间的线段缩放为设定的长度。
     */
    normalize(): void;
}
