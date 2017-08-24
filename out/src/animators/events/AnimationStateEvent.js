var feng3d;
(function (feng3d) {
    /**
     * Dispatched to notify changes in an animation state's state.
     */
    var AnimationStateEvent = (function () {
        /**
         * Create a new <code>AnimatonStateEvent</code>
         *
         * @param type The event type.
         * @param animator The animation state object that is the subject of this event.
         * @param animationNode The animation node inside the animation state from which the event originated.
         */
        function AnimationStateEvent(animator, animationState, animationNode) {
            this.animator = animator;
            this.animationState = animationState;
            this.animationNode = animationNode;
        }
        return AnimationStateEvent;
    }());
    feng3d.AnimationStateEvent = AnimationStateEvent;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=AnimationStateEvent.js.map