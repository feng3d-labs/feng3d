namespace feng3d
{
    /**
     * The mode used to generate new points in a shape (Shuriken).
     * 
     * 用于在形状中生成新点的模式
     */
    export enum ParticleSystemShapeMultiModeValue
    {
        /**
         * Generate points randomly. (Default)
         * 
         * 生成随机点。(默认)
         */
        Random = 0,
        /**
         * Animate the emission point around the shape.
         * 
         * 使发射点围绕形状运动。
         */
        Loop = 1,
        /**
         * Animate the emission point around the shape, alternating between clockwise and counter-clockwise directions.
         * 
         * 使发射点围绕形状运动，在顺时针和逆时针方向之间交替。
         */
        PingPong = 2,
        /**
         * Distribute new particles around the shape evenly.
         * 
         * 在形状周围均匀分布新粒子。
         * 
         * @todo
         */
        BurstSpread = 3,
    }
}