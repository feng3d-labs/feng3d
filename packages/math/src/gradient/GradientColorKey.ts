import type { Color3 } from '../color/color3';

/**
 * 渐变颜色键
 */
export interface GradientColorKey
{
    /**
     * 颜色值
     *
     * 阶段 C-b 起 `Color3` 是**带 `__type__` 的纯数据接口**（原 class 已删）：
     * `Gradient` 的默认键与 `gradientFromColors` 产出的键都带上判别字段（见 `./gradient.ts`）。
     */
    color: Color3;

    /**
     * 时间
     */
    time: number;
}
