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
        @serialize
        @oav({ tooltip: "每秒发射粒子数量" })
        rate = Object.setValue(new MinMaxCurve(), { between0And1: true, constant: 10, constant1: 10 });
        // rate = 10;

        /**
         * 爆发，在time时刻额外喷射particles粒子
         */
        @serialize
        @oav({ component: "OAVArray", tooltip: "在指定时间进行额外发射指定数量的粒子", componentParam: { defaultItem: () => { return { time: 0, num: 30 } } } })
        bursts: { time: number, num: number }[] = [];
    }
}