import { MinMaxCurve } from '../../../math/curve/MinMaxCurve';
import { MinMaxCurveMode } from '../../../math/curve/MinMaxCurveMode';
import { Vector2 } from '../../../math/geom/Vector2';
import { oav } from '../../../objectview/ObjectView';
import { mathUtil } from '../../../polyfill/MathUtil';
import { $set } from '../../../serialization/Serialization';
import { SerializeProperty } from '../../../serialization/SerializeProperty';
import { ParticleSystemAnimationType } from '../enums/ParticleSystemAnimationType';
import { UVChannelFlags } from '../enums/UVChannelFlags';
import { Particle } from '../Particle';
import { ParticleModule, RegisterParticleModule } from './ParticleModule';

declare module './ParticleModule' { interface ParticleModuleMap { ParticleTextureSheetAnimationModule: ParticleTextureSheetAnimationModule } }
/**
 * 粒子系统纹理表动画模块。
 */
@RegisterParticleModule('ParticleTextureSheetAnimationModule')
export class ParticleTextureSheetAnimationModule extends ParticleModule
{
    /**
     * Defines the tiling of the texture.
     *
     * 定义纹理的平铺。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Defines the tiling of the texture." })
    @oav({ tooltip: '定义纹理的平铺。' })
    tiles = new Vector2(1, 1);

    /**
     * Specifies the animation type.
     *
     * 指定动画类型。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Specifies the animation type." })
    @oav({ tooltip: '指定动画类型。', component: 'OAVEnum', componentParam: { enumClass: ParticleSystemAnimationType } })
    animation = ParticleSystemAnimationType.WholeSheet;

    /**
     * Curve to control which frame of the texture sheet animation to play.
     *
     * 曲线控制哪个帧的纹理表动画播放。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Curve to control which frame of the texture sheet animation to play." })
    @oav({ tooltip: '曲线控制哪个帧的纹理表动画播放。' })
    frameOverTime = $set(new MinMaxCurve(), { mode: MinMaxCurveMode.Curve, curveMin: { keys: [{ time: 0, value: 0, inTangent: 1, outTangent: 1 }, { time: 1, value: 1, inTangent: 1, outTangent: 1 }] } });

    /**
     * Use a random row of the texture sheet for each particle emitted.
     *
     * 对每个发射的粒子使用纹理表的随机行。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Use a random row of the texture sheet for each particle emitted." })
    @oav({ tooltip: '对每个发射的粒子使用纹理表的随机行。' })
    useRandomRow = true;

    /**
     * Explicitly select which row of the texture sheet is used, when useRandomRow is set to false.
     *
     * 当useRandomRow设置为false时，显式选择使用纹理表的哪一行。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Explicitly select which row of the texture sheet is used, when useRandomRow is set to false." })
    @oav({ tooltip: '当useRandomRow设置为false时，显式选择使用纹理表的哪一行。' })
    get rowIndex() { return this._rowIndex; }
    set rowIndex(v)
    {
        this._rowIndex = mathUtil.clamp(v, 0, this.tiles.y - 1);
    }
    private _rowIndex = 0;

    /**
     * Define a random starting frame for the texture sheet animation.
     *
     * 为纹理表动画定义一个随机的起始帧。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Define a random starting frame for the texture sheet animation." })
    @oav({ tooltip: '为纹理表动画定义一个随机的起始帧。' })
    startFrame = new MinMaxCurve();

    /**
     * Specifies how many times the animation will loop during the lifetime of the particle.
     *
     * 指定在粒子的生命周期内动画将循环多少次。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Specifies how many times the animation will loop during the lifetime of the particle." })
    @oav({ tooltip: '指定在粒子的生命周期内动画将循环多少次。' })
    cycleCount = 1;

    /**
     * Flip the UV coordinate on particles, causing them to appear mirrored.
     *
     * 在粒子上翻转UV坐标，使它们呈现镜像翻转。
     */
    @SerializeProperty()
    // @oav({ tooltip: "Flip the UV coordinate on particles, causing them to appear mirrored." })
    @oav({ tooltip: '在粒子上翻转UV坐标，使它们呈现镜像翻转。' })
    flipUV = new Vector2();

    /**
     * Choose which UV channels will receive texture animation.
     *
     * 选择哪个UV通道将接收纹理动画。
     *
     * todo 目前引擎中只有一套UV
     */
    @SerializeProperty()
    // @oav({ tooltip: "Choose which UV channels will receive texture animation.", component: "OAVEnum", componentParam: { enumClass: UVChannelFlags } })
    @oav({ tooltip: '选择哪个UV通道将接收纹理动画。', component: 'OAVEnum', componentParam: { enumClass: UVChannelFlags } })
    uvChannelMask = UVChannelFlags.Everything;

    /**
     * Flip the U coordinate on particles, causing them to appear mirrored horizontally.
     *
     * 在粒子上翻转U坐标，使它们呈现水平镜像。
     */
    get flipU()
    {
        return this.flipUV.x;
    }

    set flipU(v)
    {
        this.flipUV.x = v;
    }

    /**
     * Flip the V coordinate on particles, causing them to appear mirrored vertically.
     *
     * 在粒子上翻转V坐标，使它们垂直镜像。
     */
    get flipV()
    {
        return this.flipUV.y;
    }

    set flipV(v)
    {
        this.flipUV.y = v;
    }

    /**
     * Frame over time mutiplier.
     *
     * 帧随时间变化的乘数。
     */
    get frameOverTimeMultiplier()
    {
        return this.frameOverTime.curveMultiplier;
    }

    set frameOverTimeMultiplier(v)
    {
        this.frameOverTime.curveMultiplier = v;
    }

    /**
     * Defines the tiling of the texture in the X axis.
     *
     * 定义纹理在X轴上的平铺。
     */
    get numTilesX()
    {
        return this.tiles.x;
    }

    set numTilesX(v)
    {
        this.tiles.x = v;
    }

    /**
     * Defines the tiling of the texture in the Y axis.
     *
     * 定义纹理在Y轴上的平铺。
     */
    get numTilesY()
    {
        return this.tiles.y;
    }

    set numTilesY(v)
    {
        this.tiles.y = v;
    }

    /**
     * Starting frame multiplier.
     *
     * 起始帧乘数。
     */
    get startFrameMultiplier()
    {
        return this.startFrame.curveMultiplier;
    }

    set startFrameMultiplier(v)
    {
        this.startFrame.curveMultiplier = v;
    }

    /**
     * 初始化粒子状态
     * @param particle 粒子
     */
    initParticleState(particle: Particle)
    {
        particle[TextureSheetAnimationFrameOverTime] = Math.random();
        particle[TextureSheetAnimationStartFrame] = Math.random();
        particle[TextureSheetAnimationRandomRow] = Math.random();
    }

    /**
     * 更新粒子状态
     * @param particle 粒子
     */
    updateParticleState(particle: Particle)
    {
        particle.tilingOffset.set(1, 1, 0, 0);
        particle.flipUV.set(0, 0);
        if (!this.enabled) return;

        const segmentsX = this.tiles.x;
        const segmentsY = this.tiles.y;
        const step = this.tiles.clone().reciprocal();
        const uvPos = new Vector2();
        const frameOverTime = this.frameOverTime.getValue(particle.rateAtLifeTime, particle[TextureSheetAnimationFrameOverTime]);
        let frameIndex = this.startFrame.getValue(particle.rateAtLifeTime, particle[TextureSheetAnimationStartFrame]);
        let rowIndex = this.rowIndex;
        const cycleCount = this.cycleCount;

        if (this.animation === ParticleSystemAnimationType.WholeSheet)
        {
            frameIndex = Math.round(frameIndex + frameOverTime * segmentsX * segmentsY * cycleCount);
            uvPos.set(frameIndex % segmentsX, Math.floor(frameIndex / segmentsX) % segmentsY).scale(step);
        }
        else if (this.animation === ParticleSystemAnimationType.SingleRow)
        {
            frameIndex = Math.round(frameIndex + frameOverTime * segmentsX * cycleCount);
            if (this.useRandomRow)
            {
                rowIndex = Math.round(segmentsY * particle[TextureSheetAnimationRandomRow]);
            }
            uvPos.set(frameIndex % segmentsX, rowIndex).scale(step);
        }

        particle.tilingOffset.set(step.x, step.y, uvPos.x, uvPos.y);
        particle.flipUV = this.flipUV;
    }
}

const TextureSheetAnimationFrameOverTime = '_TextureSheetAnimation_rateAtLifeTime';
const TextureSheetAnimationStartFrame = '_TextureSheetAnimation_startFrame';
const TextureSheetAnimationRandomRow = '_TextureSheetAnimation_randomRow';
