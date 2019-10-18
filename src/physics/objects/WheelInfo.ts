namespace CANNON
{
    /**
     * 轮子信息
     */
    export class WheelInfo
    {
        /**
         * Max travel distance of the suspension, in meters.
         */
        maxSuspensionTravel = 1;

        /**
         * Speed to apply to the wheel rotation when the wheel is sliding.
         */
        customSlidingRotationalSpeed = -0.1;

        /**
         * If the customSlidingRotationalSpeed should be used.
         */
        useCustomSlidingRotationalSpeed = false

        sliding = false

        /**
         * Connection point, defined locally in the chassis body frame.
         */
        get chassisConnectionPointLocal()
        {
            return this._chassisConnectionPointLocal;
        }
        set chassisConnectionPointLocal(v)
        {
            this._chassisConnectionPointLocal.copy(v);
        }
        private _chassisConnectionPointLocal = new feng3d.Vector3()

        get chassisConnectionPointWorld()
        {
            return this._chassisConnectionPointWorld;
        }
        set chassisConnectionPointWorld(v)
        {
            this._chassisConnectionPointWorld.copy(v);
        }
        private _chassisConnectionPointWorld = new feng3d.Vector3()

        get directionLocal()
        {
            return this._directionLocal;
        }
        set directionLocal(v)
        {
            this._directionLocal.copy(v);
        }
        private _directionLocal = new feng3d.Vector3();

        get directionWorld()
        {
            return this._directionWorld;
        }
        set directionWorld(v)
        {
            this._directionWorld.copy(v);
        }
        private _directionWorld = new feng3d.Vector3();

        get axleLocal()
        {
            return this._axleLocal;
        }
        set axleLocal(v)
        {
            this._axleLocal.copy(v);
        }
        private _axleLocal = new feng3d.Vector3();

        get axleWorld()
        {
            return this._axleWorld;
        }
        set axleWorld(v)
        {
            this._axleWorld.copy(v);
        }
        private _axleWorld = new feng3d.Vector3();

        suspensionRestLength = 1;

        suspensionMaxLength = 2;

        radius = 1;

        suspensionStiffness = 100;

        dampingCompression = 10;

        dampingRelaxation = 10;

        frictionSlip = 10000;

        steering = 0;

        /**
         * Rotation value, in radians.
         */
        rotation = 0;

        deltaRotation = 0;

        rollInfluence = 0.01;

        maxSuspensionForce = Number.MAX_VALUE;

        engineForce = 0;

        brake = 0;

        isFrontWheel = true;

        clippedInvContactDotSuspension = 1;

        suspensionRelativeVelocity = 0;

        suspensionForce = 0;

        skidInfo = 0;

        suspensionLength = 0;

        sideImpulse = 0;

        forwardImpulse = 0;

        /**
         * The result from raycasting
         */
        raycastResult = new RaycastResult();

        /**
         * Wheel world transform
         */
        worldTransform = new Transform();

        isInContact = false;

        updateWheel(chassis: Body)
        {
            var raycastResult = this.raycastResult;

            if (this.isInContact)
            {
                var project = raycastResult.hitNormalWorld.dot(raycastResult.directionWorld);

                var relpos = raycastResult.hitPointWorld.subTo(chassis.position);

                var chassis_velocity_at_contactPoint = chassis.getVelocityAtWorldPoint(relpos);
                var projVel = raycastResult.hitNormalWorld.dot(chassis_velocity_at_contactPoint);
                if (project >= -0.1)
                {
                    this.suspensionRelativeVelocity = 0.0;
                    this.clippedInvContactDotSuspension = 1.0 / 0.1;
                } else
                {
                    var inv = -1 / project;
                    this.suspensionRelativeVelocity = projVel * inv;
                    this.clippedInvContactDotSuspension = inv;
                }

            } else
            {
                // Not in contact : position wheel in a nice (rest length) position
                this.suspensionRelativeVelocity = 0.0;
                raycastResult.directionWorld.scaleNumberTo(-1, raycastResult.hitNormalWorld);
                this.clippedInvContactDotSuspension = 1.0;
            }
        }
    }
}
