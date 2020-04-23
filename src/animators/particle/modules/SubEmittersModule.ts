namespace feng3d
{
    /**
     * Script interface for the SubEmittersModule.
     * 
     * The sub-emitters module allows you to spawn particles in child emitters from the positions of particles in the parent system.
     * 
     * This module triggers child particle emission on events such as the birth, death, and collision of particles in the parent system.
     */
    export class SubEmittersModule extends ParticleModule
    {
        /**
         * The total number of sub-emitters.
         */
        subEmittersCount: number;

        /**
         * Add a new sub-emitter.
         */
        AddSubEmitter(subEmitter: ParticleSystem, type: ParticleSystemSubEmitterType, properties: ParticleSystemSubEmitterProperties, emitProbability: number)
        {

        }

        /**
         * Gets the probability that the sub-emitter emits particles.
         * 
         * @param index The index of the sub-emitter.
         */
        GetSubEmitterEmitProbability(index: number)
        {

        }

        /**
         * Gets the properties of the sub - emitter at the given index.
         * 
         * @param index The index of the sub-emitter.
         */
        GetSubEmitterProperties(index: number)
        {

        }

        /**
         * Gets the sub - emitter Particle System at the given index.
         * 
         * @param index The index of the desired sub-emitter.
         */
        GetSubEmitterSystem(index: number)
        {

        }

        /**
         * Gets the type of the sub - emitter at the given index.
         * 
         * @param index The index of the desired sub-emitter.
         */
        GetSubEmitterType(index: number)
        {

        }

        /**
         * Removes a sub - emitter from the given index in the array.
         * 
         * @param index The index of the desired sub-emitter.
         */
        RemoveSubEmitter(index: number)
        {

        }

        /**
         * Sets the probability that the sub - emitter emits particles.
         * 
         * @param index The index of the sub-emitter you want to modify.
         * @param emitProbability The probability value.
         */
        SetSubEmitterEmitProbability(index: number, emitProbability: number)
        {

        }

        /**
         * Sets the properties of the sub - emitter at the given index.
         * 
         * @param index The index of the sub-emitter you want to modify.
         * @param properties The new properties to assign to this sub-emitter.
         */
        SetSubEmitterProperties(index: number, properties: ParticleSystemSubEmitterProperties)
        {

        }

        /**
         * Sets the Particle System to use as the sub - emitter at the given index.
         */
        SetSubEmitterSystem(index: number, subEmitter: ParticleSystem)
        {

        }

        /**
         * Sets the type of the sub - emitter at the given index.
         * 
         * @param index The index of the sub-emitter you want to modify.
         * @param type The new spawning type to assign to this sub-emitter.
         */
        SetSubEmitterType(index: number, type: ParticleSystemSubEmitterType)
        {

        }

    }
}