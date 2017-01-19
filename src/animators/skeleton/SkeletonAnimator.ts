module feng3d {

    /**
     * 骨骼动画
     * @author feng 2017-01-19
     */
    export class SkeletonAnimator extends Object3DComponent {

        /**
         * 是否正在播放
         */
        public isPlaying: boolean;

        /**
         * 动画时间
         */
        public time: number = 0;

        /**
         * 起始时间
         */
        public startTime: number = 0;

        /**
         * 播放速度
         */
        public playbackSpeed: number = 1;

        /**
         * 骨骼
         */
        public skeleton: Skeleton;
    }
}