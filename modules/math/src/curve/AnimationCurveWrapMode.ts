namespace feng3d
{
    /**
     * 动画曲线Wrap模式，处理超出范围情况
     */
    export enum WrapMode
    {
        /**
         * 夹紧; 0>-<1
         */
        Clamp = 1,
        /**
         * 循环; 0->1,0->1
         */
        Loop = 2,
        /**
         * 来回循环; 0->1,1->0
         */
        PingPong = 4,

        /**
         * When time reaches the end of the animation clip, the clip will automatically stop playing and time will be reset to beginning of the clip.
         */
        Once,

        /**
         * Reads the default repeat mode set higher up.
         */
        Default,
    }
}