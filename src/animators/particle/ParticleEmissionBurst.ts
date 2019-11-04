namespace feng3d
{
    export class ParticleEmissionBurst
    {
        /**
         * 每次爆炸发生的时间。
         */
        @serialize
        // @oav({ tooltip: "The time that each burst occurs." })
        @oav({ tooltip: "每次爆炸发生的时间。" })
        time = 0;
        
        /**
         * 要发射的粒子数。
         */
        @serialize
        // @oav({ tooltip: "Number of particles to be emitted." })
        @oav({ tooltip: "要发射的粒子数。" })
        count = serialization.setValue(new MinMaxCurve(), { constant: 30, constant1: 30 });

        /**
         * 爆发次数。(0意味着无限)。
         * 
         * @todo
         */
        @serialize
        // @oav({ tooltip: "How many times to play the burst. (0 means infinitely)." })
        @oav({ tooltip: "爆发次数。(0意味着无限)。" })
        cycleCount = 1;

        /**
         * 多久重复一次，以秒为单位。
         * 
         * @todo
         */
        @serialize
        // @oav({ tooltip: "How often to repeat the burst, in seconds." })
        @oav({ tooltip: "多久重复一次，以秒为单位。" })
        repeatInterval = 0.01;
        
        /**
         * 喷发被触发的几率。
         */
        @serialize
        // @oav({ tooltip: "The chance that the burst will trigger." })
        @oav({ tooltip: "喷发被触发的几率。取值在0与1之间，默认1。" })
        probability = 1.0;

        /**
         * 是否喷发
         */
        get isProbability()
        {
            return this._isProbability;
        }

        private _isProbability = true;

        /**
         * 通过触发的几率计算是否喷发。
         */
        calculateProbability()
        {
            this._isProbability = this.probability >= Math.random();
            return this._isProbability;
        }
    }
}