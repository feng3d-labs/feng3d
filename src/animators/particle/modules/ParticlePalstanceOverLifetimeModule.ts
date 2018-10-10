namespace feng3d
{
    /**
     * 粒子系统 角速度随时间变化模块
     */
    export class ParticlePalstanceOverLifetimeModule extends ParticleModule
    {
        @serialize
        @oav({ tooltip: "角速度" })
        palstance = new Vector3();

        /**
         * 更新粒子状态
         * @param particle 粒子
         */
        updateParticleState(particle: Particle, preTime: number, time: number)
        {
            particle.rotation.x += this.palstance.x * (time - preTime);
            particle.rotation.y += this.palstance.y * (time - preTime);
            particle.rotation.z += this.palstance.z * (time - preTime);
        }
    }
}