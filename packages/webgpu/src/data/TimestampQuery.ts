/**
 * 查询通道运行消耗时长（单位为纳秒）。
 */
export interface TimestampQuery
{
    /**
     * 当前WebGPU是否支持该特性。
     *
     * 默认值为`undefined`，在运行时自动赋值，如果当前WebGPU不支持该特性，则该属性为`false`。
     */
    readonly isSupports?: boolean;

    /**
     * 通道运行消耗时长（单位为纳秒）。
     *
     * 默认值为`undefined`，在运行时自动赋值。
     */
    readonly result?: {
        /**
         * 通道运行消耗时长（单位为纳秒）。
         */
        elapsedNs: number;
    };
}
