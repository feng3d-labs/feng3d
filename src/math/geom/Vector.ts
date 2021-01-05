namespace feng3d
{
    /**
     * 向量
     */
    export interface Vector
    {
        /**
         * 将另一个点的坐标添加到此点的坐标。
         * @param v 要添加的点。
         */
        add(v: Vector): Vector;

        /**
         * 将另一个点的坐标添加到此点的坐标以创建一个新点。
         * @param v 要添加的点。
         * @param vout 用于接收计算结果。
         * @returns 新点。
         */
        addTo(v: Vector, vout?: Vector): Vector;

        /**
         * 从此点的坐标中减去另一个点的坐标。
         * @param v 要减去的点。
         */
        sub(v: Vector): Vector;

        /**
         * 从此点的坐标中减去另一个点的坐标以创建一个新点。
         * @param v 要减去的点。
         * @param vout 用于接收计算结果。
         * @returns 新点。
         */
        subTo(v: Vector, vout?: Vector): Vector;

        /**
         * 乘以向量
         * @param v 向量
         */
        multiply(v: Vector): this;

        /**
         * 乘以向量
         * @param v 向量
         * @param vout 输出向量
         */
        multiplyTo(v: Vector, vout?: Vector): Vector;

        /**
         * 除以向量
         * @param v 向量
         */
        divide(v: Vector): this;

        /**
         * 除以向量
         * @param v 向量
         * @param vout 输出向量 
         */
        divideTo(v: Vector, vout?: Vector): Vector;

        /**
         * 确定两个向量是否相同。如果两个向量具有相同的分量值，则它们是相同的向量。
         * @param toCompare 要比较的向量。
         * @returns 如果该对象与此 向量 对象相同，则为 true 值，如果不相同，则为 false。
         */
        equals(toCompare: Vector, precision?: number): boolean;

        /**
         * 将源 Vector 对象中的所有点数据复制到调用方 Vector 对象中。
         * @param source 要从中复制数据的 Vector 对象。
         */
        copy(source: Vector): Vector;

        /**
         * 与目标点之间的距离
         * @param p 目标点
         */
        distance(p: Vector): number;

        /**
         * 与目标点之间的距离平方
         * @param p 目标点
         */
        distanceSquared(p: Vector): number;

        /**
         * 将 (0,0) 和当前点之间的线段缩放为设定的长度。
         * 
         * @param thickness 缩放值。例如，如果当前点为 (0,5) 并且您将它规范化为 1，则返回的点位于 (0,1) 处。
         */
        normalize(thickness?: number): Vector;
    }
}