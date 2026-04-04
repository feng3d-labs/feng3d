/**
 * The properties of sub-emitter particles.
 */
export enum ParticleSystemSubEmitterProperties
{
    /**
     * When spawning new particles, do not inherit any properties from the parent particles.
     */
    InheritNothing,

    /**
     * When spawning new particles, inherit all available properties from the parent particles.
     */
    InheritEverything,

    /**
     * When spawning new particles, multiply the start color by the color of the parent particles.
     */
    InheritColor,

    /**
     * When spawning new particles, multiply the start size by the size of the parent particles.
     */
    InheritSize,

    /**
     * When spawning new particles, add the start rotation to the rotation of the parent particles.
     */
    InheritRotation,

    /**
     * New particles will have a shorter lifespan, the closer their parent particles are to death.
     */
    InheritLifetime,

    /**
     * When spawning new particles, use the duration and age properties from the parent system, when sampling MainModule curves in the Sub-Emitter.
     */
    InheritDuration,
}
