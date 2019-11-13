namespace feng3d
{
    /**
     * The Inherit Velocity Module controls how the velocity of the emitter is transferred to the particles as they are emitted.
     * 
     * 遗传速度模块控制发射体的速度在粒子发射时如何传递到粒子上。
     */
    export class InheritVelocityModule extends ParticleModule
    {
        /**
         * How to apply emitter velocity to particles.
         * 
         * 如何将发射体速度应用于粒子。
         */
        mode = ParticleSystemInheritVelocityMode.Initial;

        /**
         * Curve to define how much emitter velocity is applied during the lifetime of a particle.
         * 
         * 曲线，用来定义在粒子的生命周期内应用了多少发射速度。
         */
        multiplier = serialization.setValue(new MinMaxCurve(), { constant: 1, constant1: 1 });

        /**
         * Curve to define how much emitter velocity is applied during the lifetime of a particle.
         * 
         * 曲线，用来定义在粒子的生命周期内应用了多少发射速度。
         */
        get curve()
        {
            return this.multiplier;
        }

        set curve(v)
        {
            this.multiplier = v;
        }

        /**
         * Change the curve multiplier.
         * 
         * 改变曲线的乘数。
         */
        get curveMultiplier()
        {
            return this.multiplier.curveMultiplier;
        }

        set curveMultiplier(v)
        {
            this.multiplier.curveMultiplier = v;
        }

    }
}