namespace CANNON
{
	export class RaycastResult
	{
		rayFromWorld = new feng3d.Vector3();

		rayToWorld = new feng3d.Vector3();

		hitNormalWorld = new feng3d.Vector3();

		hitPointWorld = new feng3d.Vector3();

		hasHit = false;

		shape: Shape = null;

		body: Body = null;

		/**
		 * The index of the hit triangle, if the hit shape was a trimesh.
		 */
		hitFaceIndex = -1;

		/**
		 * Distance to the hit. Will be set to -1 if there was no hit.
		 */
		distance = -1;

		suspensionLength: number;
		directionWorld: feng3d.Vector3;

		/**
		 * If the ray should stop traversing the bodies.
		 */
		_shouldStop = false;
        groundObject: number;

		/**
		 * Storage for Ray casting data.
		 */
		constructor()
		{

		}

		/**
		 * Reset all result data.
		 */
		reset()
		{
			this.rayFromWorld.setZero();
			this.rayToWorld.setZero();
			this.hitNormalWorld.setZero();
			this.hitPointWorld.setZero();
			this.hasHit = false;
			this.shape = null;
			this.body = null;
			this.hitFaceIndex = -1;
			this.distance = -1;
			this._shouldStop = false;
		}

		abort()
		{
			this._shouldStop = true;
		}

		set(
			rayFromWorld: feng3d.Vector3,
			rayToWorld: feng3d.Vector3,
			hitNormalWorld: feng3d.Vector3,
			hitPointWorld: feng3d.Vector3,
			shape: Shape,
			body: Body,
			distance: number
		)
		{
			this.rayFromWorld.copy(rayFromWorld);
			this.rayToWorld.copy(rayToWorld);
			this.hitNormalWorld.copy(hitNormalWorld);
			this.hitPointWorld.copy(hitPointWorld);
			this.shape = shape;
			this.body = body;
			this.distance = distance;
		}
	}
}