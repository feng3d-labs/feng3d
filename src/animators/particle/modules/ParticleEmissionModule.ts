namespace feng3d
{
    /**
     * 粒子发射器

     */
    export class ParticleEmissionModule extends ParticleModule
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
    }
}