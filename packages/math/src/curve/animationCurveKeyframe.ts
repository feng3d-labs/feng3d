/**
 * 动画关键帧（纯数据接口，issue #134 曲线族批）。
 *
 * 原先是一个字段可变的 interface：这里按「读侧只读、写侧另立形状」（规范 §11.6）拆成
 * {@link AnimationCurveKeyframe}（读）与 {@link WritableAnimationCurveKeyframe}（写）。
 * 曲线编辑器改关键帧时经写侧形状写入原始数据。
 */
export interface AnimationCurveKeyframe
{
    /** 关键帧时间 */
    readonly time: number;

    /** 曲线在关键帧处的值 */
    readonly value: number;

    /** 从前一个点接近该点时的切线 */
    readonly inTangent: number;

    /** 离开该点走向下一个点时的切线 */
    readonly outTangent: number;
}

/** 可写出的关键帧（写侧形状：曲线编辑器改字段、getPoint 的 out）。 */
export interface WritableAnimationCurveKeyframe
{
    time: number;
    value: number;
    inTangent: number;
    outTangent: number;
}

/**
 * 缺省关键帧（与原 AnimationCurve.keys 的初值逐字一致：time 0 / value 1 / 切线 0）。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function animationCurveKeyframeDefault(out: WritableAnimationCurveKeyframe = { time: 0, value: 1, inTangent: 0, outTangent: 0 }): WritableAnimationCurveKeyframe
{
    out.time = 0;
    out.value = 1;
    out.inTangent = 0;
    out.outTangent = 0;

    return out;
}
