import { MinMaxCurve } from '../../../math/curve/MinMaxCurve';
import { oav } from '../../../objectview/ObjectView';
import { Serializable } from '../../../serialization/Serializable';
import { $set } from '../../../serialization/Serialization';
import { SerializeProperty } from '../../../serialization/SerializeProperty';

declare module '../../../serialization/Serializable' { interface SerializableMap { ParticleEmissionBurst: ParticleEmissionBurst } }

@Serializable('ParticleEmissionBurst')
export class ParticleEmissionBurst
{
    declare __class__: 'ParticleEmissionBurst';

    /**
     * The time that each burst occurs.
     * 每次爆炸发生的时间。
     */
    @SerializeProperty()
    // @oav({ tooltip: "The time that each burst occurs." })
    @oav({ tooltip: '每次爆炸发生的时间。' })
    time = 0;

    /**
     * 要发射的粒子数。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Number of particles to be emitted." })
    @oav({ tooltip: '要发射的粒子数。' })
    count = $set(new MinMaxCurve(), { constant: 30, constantMin: 30, constantMax: 30 });

    /**
     * Minimum number of bursts to be emitted.
     * 要发射的最小爆发数量。
     */
    get minCount()
    {
        return this.count.constantMin;
    }

    set minCount(v)
    {
        this.count.constantMin = v;
    }

    /**
     * Maximum number of bursts to be emitted.
     *
     * 要发射的最大爆发数量。
     */
    get maxCount()
    {
        return this.count.constantMax;
    }

    set maxCount(v)
    {
        this.count.constantMax = v;
    }

    /**
     * 喷发被触发的几率。
     */
    @SerializeProperty()
    // @oav({ tooltip: "The chance that the burst will trigger." })
    @oav({ tooltip: '喷发被触发的几率。取值在0与1之间，默认1。' })
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
