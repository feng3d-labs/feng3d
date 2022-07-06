namespace feng3d
{
    /**
     * 粒子系统圆锥体发射类型，用于定义基于圆锥体的发射类型。
     */
    export enum ParticleSystemShapeConeEmitFrom
    {
        /**
         * 从圆锥体底面发射。
         */
        Base,
        /**
         * 从圆锥体底面边缘沿着曲面发射。
         */
        BaseShell,
        /**
         * 从圆锥体内部发射。
         */
        Volume,
        /**
         * 从圆锥体曲面沿着曲面发射。
         */
        VolumeShell,
    }
}