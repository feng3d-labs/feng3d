namespace feng3d.war3
{

	/**
	 *
	 * @author warden_feng 2014-6-28
	 */
	export class SkeletonClipNodeWar3 extends SkeletonClipNode
	{
		constructor()
		{
			super();
		}

		protected updateStitch(): void
		{
			this._stitchDirty = false;

			//_lastFrame = (_looping && _stitchFinalFrame) ? _numFrames : _numFrames - 1;

			this._totalDuration = 500;
			this._totalDelta.x = 0;
			this._totalDelta.y = 0;
			this._totalDelta.z = 0;
		}
	}
}
