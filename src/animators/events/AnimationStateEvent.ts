namespace feng3d
{
	/**
	 * Dispatched to notify changes in an animation state's state.
	 */
	export class AnimationStateEvent
	{
		animator: AnimatorBase;
		animationState: AnimationStateBase;
		animationNode: AnimationNodeBase;

		/**
		 * Create a new <code>AnimatonStateEvent</code>
		 *
		 * @param type The event type.
		 * @param animator The animation state object that is the subject of this event.
		 * @param animationNode The animation node inside the animation state from which the event originated.
		 */
		constructor(animator: AnimatorBase, animationState: AnimationStateBase, animationNode: AnimationNodeBase)
		{
			this.animator = animator;
			this.animationState = animationState;
			this.animationNode = animationNode;
		}
	}
}
