import type { Color3 } from '../color/color3Ops';

/**
 * 渐变颜色键
 */
export interface GradientColorKey
{
    /**
     * 颜色值
     *
     * 阶段 C-b 起 `Color3` 是**带 `__type__` 的纯数据接口**（原 class 已删）：
     * `Gradient` 的默认键与 `fromColors` 产出的键都带上判别字段，`Gradient.getColor()`
     * 因此也恒返回带标记的颜色（见 `../gradient/Gradient.ts`）。
     */
    color: Color3;

    /**
     * 时间
     */
    time: number;
}
