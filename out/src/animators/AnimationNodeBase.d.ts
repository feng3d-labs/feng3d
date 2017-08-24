declare namespace feng3d {
    /**
     * 动画节点基类
     * @author feng 2014-5-20
     */
    class AnimationNodeBase extends Event {
        protected _stateClass: any;
        /**
         * 状态类
         */
        readonly stateClass: any;
    }
}
