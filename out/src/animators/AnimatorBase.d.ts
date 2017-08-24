declare namespace feng3d {
    interface AnimatorBaseEventMap extends ComponentEventMap {
        /** 开始播放动画 */
        start: any;
        /** 继续播放动画 */
        play: any;
        /** 停止播放动画 */
        stop: any;
    }
    interface AnimatorBase {
        once<K extends keyof AnimatorBaseEventMap>(type: K, listener: (event: AnimatorBaseEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof AnimatorBaseEventMap>(type: K, data?: AnimatorBaseEventMap[K], bubbles?: boolean): any;
        has<K extends keyof AnimatorBaseEventMap>(type: K): boolean;
        on<K extends keyof AnimatorBaseEventMap>(type: K, listener: (event: AnimatorBaseEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof AnimatorBaseEventMap>(type?: K, listener?: (event: AnimatorBaseEventMap[K]) => any, thisObject?: any): any;
    }
    /**
     * 动画基类
     * @author feng 2014-5-27
     */
    abstract class AnimatorBase extends Component {
        /** 是否正在播放动画 */
        private _isPlaying;
        private _autoUpdate;
        private _time;
        /** 播放速度 */
        private _playbackSpeed;
        protected _activeNode: AnimationNodeBase;
        protected _activeState: AnimationStateBase;
        /** 当前动画时间 */
        protected _absoluteTime: number;
        private _animationStates;
        /**
         * 是否更新位置
         */
        updatePosition: boolean;
        /**
         * 创建一个动画基类
         */
        constructor(gameObject: GameObject);
        /**
         * 获取动画状态
         * @param node		动画节点
         * @return			动画状态
         */
        getAnimationState(node: AnimationNodeBase): AnimationStateBase;
        /**
         * 动画时间
         */
        time: number;
        /**
         * 播放速度
         * <p>默认为1，表示正常速度</p>
         */
        playbackSpeed: number;
        /**
         * 开始动画，当自动更新为true时有效
         */
        start(): void;
        /**
         * 暂停播放动画
         * @see #time
         * @see #update()
         */
        stop(): void;
        /**
         * 更新动画
         * @param time			动画时间
         */
        update(time: number): void;
        /**
         * 更新偏移时间
         * @private
         */
        protected updateDeltaTime(dt: number): void;
        /**
         * 自动更新动画时帧更新事件
         */
        private onEnterFrame(event?);
        /**
         * 应用位置偏移量
         */
        private applyPositionDelta();
    }
}
