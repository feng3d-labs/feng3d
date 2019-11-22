namespace feng3d
{
    /**
     * 粒子模拟空间
     */
    export enum ParticleSystemSimulationSpace
    {
        /**
         * Simulate particles in local space.
         * 
         * 模拟局部空间中的粒子。
         */
        Local = 0,

        /**
         * Simulate particles in world space.
         * 
         * 模拟世界空间中的粒子。
         */
        World = 1,

        /**
         * Simulate particles relative to a custom transform component, defined by ParticleMainModule.customSimulationSpace.
         * 
         * 模拟粒子相对于自定义变换组件，该组件由ParticleMainModule.customSimulationSpace定义。
         */
        Custom = 2
    }

}