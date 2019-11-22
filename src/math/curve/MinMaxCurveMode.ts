namespace feng3d
{
    /**
     * 曲线模式
     */
    export enum MinMaxCurveMode
    {
        /**
         * Use a single constant for the MinMaxCurve.
         * 
         * 使用单个常数。
         */
        Constant = 0,
        /**
         * Use a single curve for the MinMaxCurve.
         * 
         * 使用一条曲线
         */
        Curve = 1,
        /**
         * Use a random value between 2 constants for the MinMaxCurve.
         * 
         * 在两个常量之间使用一个随机值
         */
        TwoConstants = 3,
        /**
         * Use a random value between 2 curves for the MinMaxCurve.
         * 
         * 在两条曲线之间使用一个随机值。
         */
        TwoCurves = 2,
    }
}