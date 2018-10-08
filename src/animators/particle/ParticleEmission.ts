namespace feng3d
{
    /**
     * 粒子发射器

     */
    export class ParticleEmission extends ParticleComponent
    {
        /**
         * 发射率，每秒发射粒子数量
         */
        @oav({ tooltip: "每秒发射粒子数量" })
        @serialize
        rate = 10;

        /**
         * 爆发，在time时刻额外喷射particles粒子
         */
        @oav({ component: "OAVArray", tooltip: "在指定时间进行额外发射指定数量的粒子", componentParam: { defaultItem: () => { return { time: 0, num: 30 } } } })
        @serialize
        bursts: { time: number, num: number }[] = [];

        isInvalid = true;

        private _numParticles;

        private _birthTimes: number[];

        particleSystem: ParticleSystem;

        /**
		 * 创建粒子属性
         * @param particle                  粒子
		 */
        generateParticle(particle: Particle, particleSystem: ParticleSystem)
        {
            if (this._numParticles != particleSystem.main.maxParticles)
                this.isInvalid = true;
            this._numParticles = particleSystem.main.maxParticles;

            particle.birthTime = this.getBirthTimeArray(particleSystem.main.maxParticles)[particle.index];
        }

        /**
         * 获取出生时间数组
         */
        private getBirthTimeArray(numParticles: number)
        {
            if (this.isInvalid)
            {
                this.isInvalid = false;

                var birthTimes: number[] = [];
                var bursts = this.bursts.concat();
                //按时间降序排列
                bursts.sort((a: { time: number; }, b: { time: number; }) => { return b.time - a.time });
                var index = 0;
                var time = 0;//以秒为单位
                var i = 0;
                var timeStep = 1 / this.rate;
                while (index < numParticles)
                {
                    while (bursts.length > 0 && bursts[bursts.length - 1].time <= time)
                    {
                        var burst = bursts.pop();
                        if (burst)
                        {
                            for (i = 0; i < burst.num; i++)
                            {
                                birthTimes[index++] = burst.time;
                            }
                        }
                    }

                    birthTimes[index++] = time;
                    time += timeStep;
                }
                this._birthTimes = birthTimes;
            }

            return this._birthTimes;
        }
    }
}