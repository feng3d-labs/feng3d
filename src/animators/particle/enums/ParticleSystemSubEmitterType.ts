namespace feng3d
{
    /**
     * The events that cause new particles to be spawned.
     * 
     * 导致新粒子产生的事件。
     */
    export enum ParticleSystemSubEmitterType
    {
        /**
         * Spawns new particles when particles from the parent system are born.
         * 
         * 当来自父系统的粒子诞生时，产生新的粒子。
         */
        Birth,

        /**
         * Spawns new particles when particles from the parent system collide with something.
         * 
         * 当来自父系统的粒子与某物碰撞时，产生新的粒子。
         */
        Collision,

        /**
         * Spawns new particles when particles from the parent system die.
         * 
         * 当来自父系统的粒子死亡时，产生新的粒子。
         */
        Death,

        /**
         * Spawns new particles when particles from the parent system pass conditions in the Trigger Module.
         * 
         * 当来自父系统的粒子通过触发器模块中的条件时，生成新的粒子。
         */
        Trigger,

        /**
         * Spawns new particles when triggered from script using ParticleSystem.TriggerSubEmitter.
         * 
         * 当使用ParticleSystem.TriggerSubEmitter从脚本中触发时，生成新的粒子。
         */
        Manual,

    }
}