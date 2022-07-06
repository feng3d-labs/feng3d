namespace feng3d
{
    /**
     * Control how particle systems apply transform scale.
     * 
     * 控制粒子系统如何应用变换尺度。
     */
    export enum ParticleSystemScalingMode
    {
        /**
         * Scale the particle system using the entire transform hierarchy.
         * 
         * 使用整个转换层次来缩放粒子系统。
         */
        Hierarchy,

        /**
         * Scale the particle system using only its own transform scale. (Ignores parent scale).
         * 
         * 尺度粒子系统只使用自己的变换尺度。(忽略了父母规模)。
         */
        Local,

        /**
         * Only apply transform scale to the shape component, which controls where particles are spawned, but does not affect their size or movement.
         * 
         * 只对形状组件应用变换比例，它控制生成粒子的位置，但不影响粒子的大小或移动。
         */
        Shape
    }
}
