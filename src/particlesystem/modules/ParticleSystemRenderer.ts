import { Geometrys } from '../../core/geometry/Geometry';
import { Material } from '../../core/materials/Material';
import { Vector3 } from '../../math/geom/Vector3';
import { serializable } from '../../serialization/ClassUtils';
import { ParticleSystemRenderMode } from '../enums/ParticleSystemRenderMode';
import { ParticleSystemRenderSpace } from '../enums/ParticleSystemRenderSpace';
import { ParticleSystemSortMode } from '../enums/ParticleSystemSortMode';
import { SpriteMaskInteraction } from '../enums/SpriteMaskInteraction';
import { ParticleModule } from './ParticleModule';

/**
 * Use this class to render particles on to the screen.
 */
@serializable()
export class ParticleSystemRenderer extends ParticleModule
{
    /**
     * The number of currently active custom vertex streams.
     */
    activeVertexStreamsCount: number;

    /**
     * Control the direction that particles face.
     */
    alignment: ParticleSystemRenderSpace;

    /**
     * Allow billboard particles to roll around their z-axis.
     */
    allowRoll: boolean;

    /**
     * How much do the particles stretch depending on the Camera's speed.
     */
    cameraVelocityScale: number;

    /**
     * Enables GPU Instancing on platforms that support it.
     */
    enableGPUInstancing: boolean;

    /**
     * Flip a percentage of the particles, along each axis.
     */
    flip: Vector3;

    /**
     * Enables freeform stretching behavior.
     */
    freeformStretching: boolean;

    /**
     * How much are the particles stretched in their direction of motion, defined as the length of the particle compared to its width.
     */
    lengthScale: number;

    /**
     * Specifies how the Particle System Renderer interacts with SpriteMask.
     */
    maskInteraction: SpriteMaskInteraction;

    /**
     * Clamp the maximum particle size.
     */
    maxParticleSize: number;

    /**
     * The Mesh that the particle uses instead of a billboarded Texture.
     */
    mesh: Geometrys;

    /**
     * The number of Meshes the system uses for particle rendering.
     */
    meshCount: number;

    /**
     * Clamp the minimum particle size.
     */
    minParticleSize: number;

    /**
     * Specifies how much a billboard particle orients its normals towards the Camera.
     */
    normalDirection: number;

    /**
     * Modify the pivot point used for rotating particles.
     */
    pivot: Vector3;

    /**
     * Specifies how the system draws particles.
     */
    renderMode: ParticleSystemRenderMode;

    /**
     * Rotate the particles based on the direction they are stretched in.This is added on top of other particle rotation.
     */
    rotateWithStretchDirection: boolean;

    /**
     * Apply a shadow bias to prevent self - shadowing artifacts.The specified value is the proportion of the particle size.
     */
    shadowBias: number;

    /**
     * Biases Particle System sorting amongst other transparencies.
     */
    sortingFudge: number;

    /**
     * Specifies how to sort particles within a system.
     */
    sortMode: ParticleSystemSortMode;

    /**
     * Set the Material that the TrailModule uses to attach trails to particles.
     */
    trailMaterial: Material;

    /**
     * Specifies how much particles stretch depending on their velocity.
     */
    velocityScale: number;
}
