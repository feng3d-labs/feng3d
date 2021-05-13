import { Color3 } from "../Color3";

/**
 * 渐变颜色键
 */
export interface GradientColorKey
{
    /**
     * 颜色值
     */
    color: Color3;

    /**
     * 时间
     */
    time: number;
}
