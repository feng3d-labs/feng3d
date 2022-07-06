namespace feng3d
{
    /**
     * How to apply emitter velocity to particles.
     * 
     * 如何将发射体速度应用于粒子。
     */
    export enum ParticleSystemInheritVelocityMode
    {
        /**
         * Each particle inherits the emitter's velocity on the frame when it was initially emitted.
         * 
         * 每个粒子在最初发射时都继承了发射体在帧上的速度。
         */
        Initial = 0,

        /**
         * Each particle's velocity is set to the emitter's current velocity value, every frame.
         * 
         * 每一帧，每个粒子的速度都设定为发射器的当前速度值。
         */
        Current = 1,
    }
}