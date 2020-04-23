namespace feng3d
{
    /**
     * The events that cause new particles to be spawned.
     */
    export enum ParticleSystemSubEmitterType
    {
        /**
         * Spawns new particles when particles from the parent system are born.
         */
        Birth,

        /**
         * Spawns new particles when particles from the parent system collide with something.
         */
        Collision,

        /**
         * Spawns new particles when particles from the parent system die.
         */
        Death,

        /**
         * Spawns new particles when particles from the parent system pass conditions in the Trigger Module.
         */
        Trigger,

        /**
         * Spawns new particles when triggered from script using ParticleSystem.TriggerSubEmitter.
         */
        Manual,

    }
}