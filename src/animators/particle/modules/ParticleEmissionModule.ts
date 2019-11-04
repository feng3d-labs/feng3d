namespace feng3d
{
    /**
     * 粒子发射器
     */
    export class ParticleEmissionModule extends ParticleModule
    {
        /**
         * 随着时间的推移，新粒子产生的速度。
         */
        @serialize
        // @oav({ tooltip: "The rate at which new particles are spawned, over time." })
        @oav({ tooltip: "随着时间的推移，新粒子产生的速度。" })
        rateOverTime = serialization.setValue(new MinMaxCurve(), { between0And1: true, constant: 10, constant1: 10 });

        /**
         * 产生新粒子的速度，通过距离。
         */
        // @oav({ tooltip: "The rate at which new particles are spawned, over distance." })
        @oav({ tooltip: "产生新粒子的速度，通过距离。" })
        rateOverDistance = serialization.setValue(new MinMaxCurve(), { between0And1: true, constant: 0, constant1: 1 });

        /**
         * 爆发，在time时刻额外喷射particles粒子
         */
        @serialize
        @oav({ component: "OAVArray", tooltip: "在指定时间进行额外发射指定数量的粒子", componentParam: { defaultItem: () => { return new ParticleEmissionBurst(); } } })
        bursts: ParticleEmissionBurst[] = [];

        /**
         * 当前的爆发次数。
         */
        get burstCount()
        {
            return this.bursts.length;
        }
    }
}