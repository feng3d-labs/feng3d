declare namespace feng3d {
    interface AnimationStateEventMap {
        /**
         * Dispatched when a non-looping clip node inside an animation state reaches the end of its timeline.
         */
        playbackComplete: AnimationStateEvent;
        transitionComplete: AnimationStateEvent;
    }
    interface AnimationClipNodeBase {
        once<K extends keyof AnimationStateEventMap>(type: K, listener: (event: AnimationStateEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof AnimationStateEventMap>(type: K, data?: AnimationStateEventMap[K], bubbles?: boolean): any;
        has<K extends keyof AnimationStateEventMap>(type: K): boolean;
        on<K extends keyof AnimationStateEventMap>(type: K, listener: (event: AnimationStateEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof AnimationStateEventMap>(type?: K, listener?: (event: AnimationStateEventMap[K]) => any, thisObject?: any): any;
    }
    /**
     * 动画剪辑节点基类(用于控制动画播放，包含每帧持续时间，是否循环播放等)
     * @author feng 2014-5-20
     */
    class AnimationClipNodeBase extends AnimationNodeBase {
        protected _looping: boolean;
        protected _totalDuration: number;
        protected _lastFrame: number;
        protected _stitchDirty: boolean;
        protected _stitchFinalFrame: boolean;
        protected _numFrames: number;
        protected _durations: number[];
        protected _totalDelta: Vector3D;
        /** 是否稳定帧率 */
        fixedFrameRate: boolean;
        /**
         * 持续时间列表（ms）
         */
        readonly durations: number[];
        /**
         * 总坐标偏移量
         */
        readonly totalDelta: Vector3D;
        /**
         * 是否循环播放
         */
        looping: boolean;
        /**
         * 是否过渡结束帧
         */
        stitchFinalFrame: boolean;
        /**
         * 总持续时间
         */
        readonly totalDuration: number;
        /**
         * 最后帧数
         */
        readonly lastFrame: number;
        /**
         * 更新动画播放控制状态
         */
        protected updateStitch(): void;
    }
}
