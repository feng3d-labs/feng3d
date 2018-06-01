namespace feng3d
{
    /**
     * 粒子发射器
     * @author feng 2017-01-09
     */
    export class ParticleEmission extends ParticleComponent
    {
        /**
         * 发射率，每秒发射粒子数量
         */
        @oav({ componentParam: { tooltip: "每秒发射粒子数量" } })
        @serialize
        rate = 100;

        /**
         * 爆发，在time时刻额外喷射particles粒子
         */
        @oav({ component: "OAVArray", componentParam: { tooltip: "在指定时间进行额外发射指定数量的粒子", defaultItem: () => { return { time: 0, num: 30 } } } })
        @serialize
        bursts: { time: number, num: number }[] = [];

        isDirty = true;

        private _numParticles;

        private _birthTimes: number[];

        /**
         * 上次发射时间
         */
        pretime = 0;

        constructor()
        {
            super();
        }

        /**
         * 发射粒子
         * @param time 当前粒子时间
         */
        emit(time: number, deathParticles: Particle[], survivalParticles: Particle[], changedParticles: Particle[])
        {
            if (deathParticles.length == 0)
                return;
            var emits: { time: number, num: number }[] = [];
            //计算事件段内正常发射了粒子
            var step = 1 / this.rate;
            for (var i = this.pretime; i < time; i += step)
            {
                emits.push({ time: i, num: 1 });
            }
            //按时间降序排列，获取该事件段内爆发的粒子
            var bursts = this.bursts.filter((a) => (this.pretime <= a.time && a.time < time));
            //
            emits = emits.concat(bursts).sort((a: { time: number; }, b: { time: number; }) => { return b.time - a.time });
            for (let i = 0; i < emits.length; i++)
            {
                if (deathParticles.length == 0)
                    return;
                const element = emits[i];
                for (let j = 0; j < element.num; j++)
                {
                    if (deathParticles.length == 0)
                        return;
                    // 获取将要发射粒子的寿命
                    
                    // getLifetime();

                }
            }

            this.rate
            this.pretime
            time
            ds.utils
        }

        /**
		 * 创建粒子属性
         * @param particle                  粒子
		 */
        generateParticle(particle: Particle, particleSystem: ParticleSystem)
        {
            if (this._numParticles != particleSystem.numParticles)
                this.isDirty = true;
            this._numParticles = particleSystem.numParticles;

            particle.birthTime = this.getBirthTimeArray(particleSystem.numParticles)[particle.index];
        }

        /**
         * 获取出生时间数组
         */
        private getBirthTimeArray(numParticles)
        {
            if (this.isDirty)
            {
                this.isDirty = false;

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