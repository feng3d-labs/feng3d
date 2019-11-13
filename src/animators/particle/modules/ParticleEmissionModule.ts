namespace feng3d
{
    /**
     * 粒子系统发射模块。
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
         * Change the rate over time multiplier.
         * This is more efficient than accessing the whole curve, if you only want to change the overall rate multiplier.
         * 
         * 改变率随时间的乘数。
         * 如果您只想更改整体的速率乘数，那么这比访问整个曲线更有效。
         */
        get rateOverTimeMultiplier()
        {
            return this.rateOverTime.curveMultiplier;
        }

        set rateOverTimeMultiplier(v)
        {
            this.rateOverTime.curveMultiplier = v;
        }

        /**
         * The rate at which new particles are spawned, over distance.
         * 
         * 产生新粒子的速度，通过距离。
         * 
         * @todo
         */
        // @oav({ tooltip: "The rate at which new particles are spawned, over distance." })
        @oav({ tooltip: "产生新粒子的速度，通过距离。" })
        rateOverDistance = serialization.setValue(new MinMaxCurve(), { between0And1: true, constant: 0, constant1: 1 });

        /**
         * Change the rate over distance multiplier.
         * This is more efficient than accessing the whole curve, if you only want to change the overall rate multiplier.
         * 
         * 改变速率随距离变化的乘数。
         * 如果您只想更改整体的速率乘数，那么这比访问整个曲线更有效。
         */
        get rateOverDistanceMultiplier()
        {
            return this.rateOverDistance.curveMultiplier;
        }

        set rateOverDistanceMultiplier(v)
        {
            this.rateOverDistance.curveMultiplier = v;
        }

        /**
         * 爆发，在time时刻额外喷射particles粒子
         */
        @serialize
        @oav({ component: "OAVArray", tooltip: "在指定时间进行额外发射指定数量的粒子", componentParam: { defaultItem: () => { return new ParticleEmissionBurst(); } } })
        bursts: ParticleEmissionBurst[] = [];

        /**
         * The current number of bursts.
         * 
         * 当前的爆发次数。
         */
        get burstCount()
        {
            return this.bursts.length;
        }

        /**
         * Get the burst array.
         * 获取突发数组。
         * 
         * @param bursts Array of bursts to be filled in.要填充的突发数组。
         * @returns The number of bursts in the array.数组中的突发次数。
         */
        GetBursts(bursts: ParticleEmissionBurst[])
        {
            bursts.length = this.bursts.length;
            for (let i = 0, n = bursts.length; i < n; i++)
            {
                bursts[i] = this.bursts[i];
            }
            return bursts.length;
        }

        /**
         * Set the burst array.
         * 设置突发数组。
         * 
         * @param bursts Array of bursts.破裂的数组。
         * @param size Optional array size, if burst count is less than array size.可选的数组大小，如果突发计数小于数组大小。
         */
        SetBursts(bursts: ParticleEmissionBurst[], size: number)
        {
            
        }
    }
}