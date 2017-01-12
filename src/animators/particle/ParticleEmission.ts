module feng3d {

    /**
     * 粒子发射器
     * @author feng 2017-01-09
     */
    export class ParticleEmission extends ParticleComponent {

        /**
         * 发射率，每秒发射粒子数量
         */
        public rate = 10;

        /**
         * 爆发，在time时刻额外喷射particles粒子
         */
        public bursts: { time: number, particles: number }[] = [];

        private birthTimes: number[];

        public isDirty = true;

        private numParticles;

        /**
		 * 创建粒子属性
         * @param particle                  粒子
         * @param numParticles              粒子数量
		 */
        public generatePropertyOfOneParticle(particle: Particle, numParticles: number) {

            if (this.numParticles != numParticles)
                this.isDirty = true;
            this.numParticles = numParticles;

            particle.birthTime = this.getBirthTimeArray(numParticles)[particle.index];
        }

        /**
         * 获取出生时间数组
         */
        private getBirthTimeArray(numParticles) {

            if (this.isDirty) {

                this.isDirty = false;

                var birthTimes: number[] = [];
                var bursts = this.bursts.concat();
                //按时间降序排列
                bursts.sort((a: { time: number; }, b: { time: number; }) => { return a.time - b.time });
                var index = 0;
                var time = 0;//以秒为单位
                var i = 0;
                while (index < numParticles) {

                    while (bursts.length > 0 && bursts[bursts.length - 1].time <= time) {
                        var burst = bursts.pop();
                        for (i = 0; i < burst.particles; i++) {
                            birthTimes[index++] = burst.time;
                        }
                    }

                    for (i = 0; i < this.rate; i++) {
                        birthTimes[index++] = time;
                    }
                    time++;
                }
                this.birthTimes = birthTimes;
            }

            return this.birthTimes;
        }
    }
}