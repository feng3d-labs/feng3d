/**
 * How particles are aligned when rendered.
 */
export enum ParticleSystemRenderSpace
{
    /**
     * Particles face the camera plane.
     */
    View,

    /**
     * Particles align with the world.
     */
    World,

    /**
     * Particles align with their local transform.
     */
    Local,

    /**
     * Particles face the eye position.
     */
    Facing,

    /**
     * Particles are aligned to their direction of travel.
     */
    Velocity,

}
