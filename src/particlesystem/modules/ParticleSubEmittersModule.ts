namespace feng3d
{
    /**
     * Script interface for the SubEmittersModule.
     * 
     * The sub-emitters module allows you to spawn particles in child emitters from the positions of particles in the parent system.
     * 
     * This module triggers child particle emission on events such as the birth, death, and collision of particles in the parent system.
     */
    export class ParticleSubEmittersModule extends ParticleModule
    {
        /**
         * The total number of sub-emitters.
         */
        get subEmittersCount()
        {
            return this.subEmitters.length;
        }

        private subEmitters: { subEmitter: ParticleSystem, type: ParticleSystemSubEmitterType, properties: ParticleSystemSubEmitterProperties, emitProbability: number }[] = [];

        /**
         * Add a new sub-emitter.
         */
        AddSubEmitter(subEmitter: ParticleSystem, type: ParticleSystemSubEmitterType, properties: ParticleSystemSubEmitterProperties, emitProbability: number)
        {
            subEmitter._isSubParticleSystem = true;

            this.subEmitters.push({ subEmitter: subEmitter, type: type, properties: properties, emitProbability: emitProbability });
        }

        /**
         * Gets the probability that the sub-emitter emits particles.
         * 
         * @param index The index of the sub-emitter.
         */
        GetSubEmitterEmitProbability(index: number)
        {
            if (!this.subEmitters[index]) return 0;
            return this.subEmitters[index].emitProbability;
        }

        /**
         * Gets the properties of the sub - emitter at the given index.
         * 
         * @param index The index of the sub-emitter.
         */
        GetSubEmitterProperties(index: number)
        {
            if (!this.subEmitters[index]) return null;
            return this.subEmitters[index].properties;
        }

        /**
         * Gets the sub - emitter Particle System at the given index.
         * 
         * @param index The index of the desired sub-emitter.
         */
        GetSubEmitterSystem(index: number)
        {
            if (!this.subEmitters[index]) return null;
            return this.subEmitters[index].subEmitter;
        }

        /**
         * Gets the type of the sub - emitter at the given index.
         * 
         * @param index The index of the desired sub-emitter.
         */
        GetSubEmitterType(index: number)
        {
            if (!this.subEmitters[index]) return null;
            return this.subEmitters[index].type;
        }

        /**
         * Removes a sub - emitter from the given index in the array.
         * 
         * @param index The index of the desired sub-emitter.
         */
        RemoveSubEmitter(index: number)
        {
            if (!this.subEmitters[index]) return;
            this.subEmitters.splice(index, 1);
        }

        /**
         * Sets the probability that the sub - emitter emits particles.
         * 
         * @param index The index of the sub-emitter you want to modify.
         * @param emitProbability The probability value.
         */
        SetSubEmitterEmitProbability(index: number, emitProbability: number)
        {
            if (!this.subEmitters[index]) return;
            this.subEmitters[index].emitProbability = emitProbability;
        }

        /**
         * Sets the properties of the sub - emitter at the given index.
         * 
         * @param index The index of the sub-emitter you want to modify.
         * @param properties The new properties to assign to this sub-emitter.
         */
        SetSubEmitterProperties(index: number, properties: ParticleSystemSubEmitterProperties)
        {
            if (!this.subEmitters[index]) return;
            this.subEmitters[index].properties = properties;
        }

        /**
         * Sets the Particle System to use as the sub - emitter at the given index.
         */
        SetSubEmitterSystem(index: number, subEmitter: ParticleSystem)
        {
            if (!this.subEmitters[index]) return;
            this.subEmitters[index].subEmitter = subEmitter;
        }

        /**
         * Sets the type of the sub - emitter at the given index.
         * 
         * @param index The index of the sub-emitter you want to modify.
         * @param type The new spawning type to assign to this sub-emitter.
         */
        SetSubEmitterType(index: number, type: ParticleSystemSubEmitterType)
        {
            if (!this.subEmitters[index]) return;
            this.subEmitters[index].type = type;
        }

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle)
        {
            for (let i = 0, n = this.subEmittersCount; i < n; i++)
            {
                var emitterType = this.GetSubEmitterType(i);
                if (emitterType == ParticleSystemSubEmitterType.Birth)
                {
                    this.particleSystem.TriggerSubEmitter(i, [particle]);
                }
            }
        }
    }
}