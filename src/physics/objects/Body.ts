namespace CANNON
{

    export interface BodyEventMap
    {

        wakeup: any;

        sleepy: any;

        sleep: any;

        collide: { body: Body, contact: ContactEquation }

    }

    export interface Body
    {
        once<K extends keyof BodyEventMap>(type: K, listener: (event: feng3d.Event<BodyEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof BodyEventMap>(type: K, data?: BodyEventMap[K], bubbles?: boolean): feng3d.Event<BodyEventMap[K]>;
        has<K extends keyof BodyEventMap>(type: K): boolean;
        on<K extends keyof BodyEventMap>(type: K, listener: (event: feng3d.Event<BodyEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof BodyEventMap>(type?: K, listener?: (event: feng3d.Event<BodyEventMap[K]>) => any, thisObject?: any): void;
    }

    export class Body extends feng3d.EventDispatcher
    {

        id: number;

        /**
         * Reference to the world the body is living in
         */
        world: World = null;

        vlambda = new feng3d.Vector3();

        collisionFilterGroup = 1;

        collisionFilterMask = -1;

        /**
         * Whether to produce contact forces when in contact with other bodies. Note that contacts will be generated, but they will be disabled.
         */
        collisionResponse = true;

        /**
         * World space position of the body.
         */
        get position()
        {
            return this._position;
        }
        set position(v)
        {
            this._position.copy(v);

            this.previousPosition.copy(v);
            this.interpolatedPosition.copy(v);
            this.initPosition.copy(v);
        }
        private _position = new feng3d.Vector3();

        previousPosition = new feng3d.Vector3();

        /**
         * Interpolated position of the body.
         */
        interpolatedPosition = new feng3d.Vector3();

        /**
         * Initial position of the body
         */
        initPosition = new feng3d.Vector3();

        /**
         * World space velocity of the body.
         */
        get velocity()
        {
            return this._velocity;
        }
        set velocity(v)
        {
            this._velocity.copy(v);
        }

        private _velocity = new feng3d.Vector3();

        initVelocity = new feng3d.Vector3();

        /**
         * Linear force on the body in world space.
         */
        force = new feng3d.Vector3();

        get mass()
        {
            return this._mass;
        }
        set mass(v)
        {
            this._mass = v;
            this.invMass = v > 0 ? 1.0 / v : 0;
            this.type = (v <= 0.0 ? Body.STATIC : Body.DYNAMIC);
        }
        private _mass = 0;

        invMass = 0;

        material: Material = null;

        linearDamping = 0.01;

        /**
         * One of: Body.DYNAMIC, Body.STATIC and Body.KINEMATIC.
         */
        type = Body.STATIC;

        /**
         * If true, the body will automatically fall to sleep.
         */
        allowSleep = true;

        /**
         * Current sleep state.
         */
        sleepState = 0;

        /**
         * If the speed (the norm of the velocity) is smaller than this value, the body is considered sleepy.
         */
        sleepSpeedLimit = 0.1;

        /**
         * If the body has been sleepy for this sleepTimeLimit seconds, it is considered sleeping.
         */
        sleepTimeLimit = 1;

        timeLastSleepy = 0;

        _wakeUpAfterNarrowphase = false;

        /**
         * World space rotational force on the body, around center of mass.
         */
        torque = new feng3d.Vector3();

        /**
         * World space orientation of the body.
         */
        get quaternion()
        {
            return this._quaternion;
        }
        set quaternion(v)
        {
            this._quaternion.copy(v);

            this.initQuaternion.copy(v);
            this.previousQuaternion.copy(v);
            this.interpolatedQuaternion.copy(v);
        }

        private _quaternion = new feng3d.Quaternion();

        initQuaternion = new feng3d.Quaternion();

        previousQuaternion = new feng3d.Quaternion();

        /**
         * Interpolated orientation of the body.
         */
        interpolatedQuaternion = new feng3d.Quaternion();


        /**
         * Angular velocity of the body, in world space. Think of the angular velocity as a vector, which the body rotates around. The length of this vector determines how fast (in radians per second) the body rotates.
         */
        get angularVelocity()
        {
            return this._angularVelocity;
        }
        set angularVelocity(v)
        {
            this._angularVelocity.copy(v);
        }

        private _angularVelocity = new feng3d.Vector3();

        initAngularVelocity = new feng3d.Vector3();

        shapes: Shape[] = [];

        /**
         * Position of each Shape in the body, given in local Body space.
         */
        shapeOffsets: feng3d.Vector3[] = [];

        /**
         * Orientation of each Shape, given in local Body space.
         */
        shapeOrientations: feng3d.Quaternion[] = [];

        inertia = new feng3d.Vector3();

        invInertia = new feng3d.Vector3();

        invInertiaWorld = new feng3d.Matrix3x3();

        invMassSolve = 0;

        invInertiaSolve = new feng3d.Vector3();

        invInertiaWorldSolve = new feng3d.Matrix3x3();

        /**
         * Set to true if you don't want the body to rotate. Make sure to run .updateMassProperties() after changing this.
         */
        fixedRotation = false;

        angularDamping = 0.01;

        /**
         * Use this property to limit the motion along any world axis. (1,1,1) will allow motion along all axes while (0,0,0) allows none.
         */
        get linearFactor()
        {
            return this._linearFactor;
        }
        set linearFactor(v)
        {
            this._linearFactor.copy(v);
        }
        private _linearFactor = new feng3d.Vector3(1, 1, 1);

        /**
         * Use this property to limit the rotational motion along any world axis. (1,1,1) will allow rotation along all axes while (0,0,0) allows none.
         */
        get angularFactor()
        {
            return this._angularFactor;
        }
        set angularFactor(v)
        {
            this._angularFactor.copy(v);
        }
        private _angularFactor = new feng3d.Vector3(1, 1, 1);

        /**
         * World space bounding box of the body and its shapes.
         */
        aabb = new feng3d.AABB();

        /**
         * Indicates if the AABB needs to be updated before use.
         */
        aabbNeedsUpdate = true;

        /**
         * Total bounding radius of the Body including its shapes, relative to body.position.
         */
        boundingRadius = 0;

        wlambda = new feng3d.Vector3();

        index: number;

        /**
         * Base class for all body types.
         * 
         * @param options 
         * @param a 
         * 
         * @example
         *     var body = new Body({
         *         mass: 1
         *     });
         *     var shape = new Sphere(1);
         *     body.addShape(shape);
         *     world.addBody(body);
         */
        constructor(mass = 0)
        {
            super();

            this.id = Body.idCounter++;

            this.mass = mass;

            this.updateMassProperties();
        }

        /**
         * A dynamic body is fully simulated. Can be moved manually by the user, but normally they move according to forces. A dynamic body can collide with all body types. A dynamic body always has finite, non-zero mass.
         */
        static DYNAMIC = 1;

        /**
         * A static body does not move during simulation and behaves as if it has infinite mass. Static bodies can be moved manually by setting the position of the body. The velocity of a static body is always zero. Static bodies do not collide with other static or kinematic bodies.
         */
        static STATIC = 2;

        /**
         * A kinematic body moves under simulation according to its velocity. They do not respond to forces. They can be moved manually, but normally a kinematic body is moved by setting its velocity. A kinematic body behaves as if it has infinite mass. Kinematic bodies do not collide with other static or kinematic bodies.
         */
        static KINEMATIC = 4;

        static AWAKE = 0;

        static SLEEPY = 1;

        static SLEEPING = 2;

        static idCounter = 0;

        /**
         * Wake the body up.
         */
        wakeUp()
        {
            var s = this.sleepState;
            this.sleepState = 0;
            this._wakeUpAfterNarrowphase = false;
            if (s === Body.SLEEPING)
            {
                this.dispatch("wakeup");
            }
        }

        /**
         * Force body sleep
         */
        sleep()
        {
            this.sleepState = Body.SLEEPING;
            this.velocity.init(0, 0, 0);
            this.angularVelocity.init(0, 0, 0);
            this._wakeUpAfterNarrowphase = false;
        }

        /**
         * Called every timestep to update internal sleep timer and change sleep state if needed.
         */
        sleepTick(time: number)
        {
            if (this.allowSleep)
            {
                var sleepState = this.sleepState;
                var speedSquared = this.velocity.lengthSquared + this.angularVelocity.lengthSquared;
                var speedLimitSquared = Math.pow(this.sleepSpeedLimit, 2);
                if (sleepState === Body.AWAKE && speedSquared < speedLimitSquared)
                {
                    this.sleepState = Body.SLEEPY; // Sleepy
                    this.timeLastSleepy = time;
                    this.dispatch("sleepy");
                } else if (sleepState === Body.SLEEPY && speedSquared > speedLimitSquared)
                {
                    this.wakeUp(); // Wake up
                } else if (sleepState === Body.SLEEPY && (time - this.timeLastSleepy) > this.sleepTimeLimit)
                {
                    this.sleep(); // Sleeping
                    this.dispatch("sleep");
                }
            }
        }

        /**
         * If the body is sleeping, it should be immovable / have infinite mass during solve. We solve it by having a separate "solve mass".
         */
        updateSolveMassProperties()
        {
            if (this.sleepState === Body.SLEEPING || this.type === Body.KINEMATIC)
            {
                this.invMassSolve = 0;
                this.invInertiaSolve.setZero();
                this.invInertiaWorldSolve.setZero();
            } else
            {
                this.invMassSolve = this.invMass;
                this.invInertiaSolve.copy(this.invInertia);
                this.invInertiaWorldSolve.copy(this.invInertiaWorld);
            }
        }

        /**
         * Convert a world point to local body frame.
         * 
         * @param worldPoint
         * @param result
         */
        pointToLocalFrame(worldPoint: feng3d.Vector3, result = new feng3d.Vector3())
        {
            worldPoint.subTo(this.position, result);
            this.quaternion.inverseTo().rotatePoint(result, result);
            return result;
        }

        /**
         * Convert a world vector to local body frame.
         * 
         * @param worldPoint
         * @param result
         */
        vectorToLocalFrame(worldVector, result = new feng3d.Vector3())
        {
            this.quaternion.inverseTo().rotatePoint(worldVector, result);
            return result;
        }

        /**
         * Convert a local body point to world frame.
         * 
         * @param localPoint
         * @param result
         */
        pointToWorldFrame(localPoint: feng3d.Vector3, result = new feng3d.Vector3())
        {
            this.quaternion.rotatePoint(localPoint, result);
            result.addTo(this.position, result);
            return result;
        }

        /**
         * Convert a local body point to world frame.
         * 
         * @param localVector
         * @param result
         */
        vectorToWorldFrame(localVector: feng3d.Vector3, result = new feng3d.Vector3())
        {
            this.quaternion.rotatePoint(localVector, result);
            return result;
        }

        /**
         * Add a shape to the body with a local offset and orientation.
         * @param shape
         * @param offset
         * @param_orientation
         * @return The body object, for chainability.
         */
        addShape(shape: Shape, offset = new feng3d.Vector3(), orientation = new feng3d.Quaternion())
        {
            this.shapes.push(shape);
            this.shapeOffsets.push(offset.clone());
            this.shapeOrientations.push(orientation.clone());
            this.updateMassProperties();
            this.updateBoundingRadius();

            this.aabbNeedsUpdate = true;

            shape.body = this;

            return this;
        }

        /**
         * Update the bounding radius of the body. Should be done if any of the shapes are changed.
         */
        updateBoundingRadius()
        {
            var shapes = this.shapes,
                shapeOffsets = this.shapeOffsets,
                N = shapes.length,
                radius = 0;

            for (var i = 0; i !== N; i++)
            {
                var shape = shapes[i];
                shape.updateBoundingSphereRadius();
                var offset = shapeOffsets[i].length,
                    r = shape.boundingSphereRadius;
                if (offset + r > radius)
                {
                    radius = offset + r;
                }
            }

            this.boundingRadius = radius;
        }

        /**
         * Updates the .aabb
         * 
         * @todo rename to updateAABB()
         */
        computeAABB()
        {
            var shapes = this.shapes,
                shapeOffsets = this.shapeOffsets,
                shapeOrientations = this.shapeOrientations,
                N = shapes.length,
                bodyQuat = this.quaternion,
                aabb = this.aabb;

            var shapeAABB = new feng3d.AABB();
            var offset = new feng3d.Vector3();
            var orientation = new feng3d.Quaternion();

            for (var i = 0; i !== N; i++)
            {
                var shape = shapes[i];

                // Get shape world position
                bodyQuat.rotatePoint(shapeOffsets[i], offset);
                offset.addTo(this.position, offset);

                // Get shape world quaternion
                shapeOrientations[i].multTo(bodyQuat, orientation);

                // Get shape AABB
                shape.calculateWorldAABB(offset, orientation, shapeAABB.min, shapeAABB.max);

                if (i === 0)
                {
                    aabb.copy(shapeAABB);
                } else
                {
                    aabb.union(shapeAABB);
                }
            }

            this.aabbNeedsUpdate = false;
        }

        /**
         * Update .inertiaWorld and .invInertiaWorld
         */
        updateInertiaWorld(force?: boolean)
        {
            var I = this.invInertia;
            if (I.x === I.y && I.y === I.z && !force)
            {
                // If inertia M = s*I, where I is identity and s a scalar, then
                //    R*M*R' = R*(s*I)*R' = s*R*I*R' = s*R*R' = s*I = M
                // where R is the rotation matrix.
                // In other words, we don't have to transform the inertia if all
                // inertia diagonal entries are equal.
            } else
            {
                var m1 = new feng3d.Matrix3x3();
                var m2 = new feng3d.Matrix3x3();

                m1.setRotationFromQuaternion(this.quaternion);
                m1.transposeTo(m2);
                m1.scale(I, m1);
                m1.mmult(m2, this.invInertiaWorld);
            }
        }

        /**
         * Apply force to a world point. This could for example be a point on the Body surface. Applying force this way will add to Body.force and Body.torque.
         * 
         * @param force The amount of force to add.
         * @param relativePoint A point relative to the center of mass to apply the force on.
         */
        applyForce(force: feng3d.Vector3, relativePoint: feng3d.Vector3)
        {
            if (this.type !== Body.DYNAMIC)
            { // Needed?
                return;
            }

            // Compute produced rotational force
            var rotForce = relativePoint.crossTo(force);

            // Add linear force
            this.force.addTo(force, this.force);

            // Add rotational force
            this.torque.addTo(rotForce, this.torque);
        }

        /**
         * Apply force to a local point in the body.
         * 
         * @param force The force vector to apply, defined locally in the body frame.
         * @param localPoint A local point in the body to apply the force on.
         */
        applyLocalForce(localForce: feng3d.Vector3, localPoint: feng3d.Vector3)
        {
            if (this.type !== Body.DYNAMIC)
            {
                return;
            }

            // Transform the force vector to world space
            var worldForce = this.vectorToWorldFrame(localForce);
            var relativePointWorld = this.vectorToWorldFrame(localPoint);

            this.applyForce(worldForce, relativePointWorld);
        }

        /**
         * Apply impulse to a world point. This could for example be a point on the Body surface. An impulse is a force added to a body during a short period of time (impulse = force * time). Impulses will be added to Body.velocity and Body.angularVelocity.
         * 
         * @param impulse The amount of impulse to add.
         * @param relativePoint A point relative to the center of mass to apply the force on.
         */
        applyImpulse(impulse: feng3d.Vector3, relativePoint: feng3d.Vector3)
        {
            if (this.type !== Body.DYNAMIC)
            {
                return;
            }

            // Compute point position relative to the body center
            var r = relativePoint;

            // Compute produced central impulse velocity
            var velo = new feng3d.Vector3();
            velo.copy(impulse);
            velo.scaleNumberTo(this.invMass, velo);

            // Add linear impulse
            this.velocity.addTo(velo, this.velocity);

            // Compute produced rotational impulse velocity
            var rotVelo = r.crossTo(impulse);

            /*
            rotVelo.x *= this.invInertia.x;
            rotVelo.y *= this.invInertia.y;
            rotVelo.z *= this.invInertia.z;
            */
            this.invInertiaWorld.vmult(rotVelo, rotVelo);

            // Add rotational Impulse
            this.angularVelocity.addTo(rotVelo, this.angularVelocity);
        }

        /**
         * Apply locally-defined impulse to a local point in the body.
         * 
         * @param force The force vector to apply, defined locally in the body frame.
         * @param localPoint A local point in the body to apply the force on.
         */
        applyLocalImpulse(localImpulse: feng3d.Vector3, localPoint: feng3d.Vector3)
        {
            if (this.type !== Body.DYNAMIC)
            {
                return;
            }

            // Transform the force vector to world space
            var worldImpulse = this.vectorToWorldFrame(localImpulse);
            var relativePointWorld = this.vectorToWorldFrame(localPoint);

            this.applyImpulse(worldImpulse, relativePointWorld);
        }

        /**
         * Should be called whenever you change the body shape or mass.
         */
        updateMassProperties()
        {
            var halfExtents = new feng3d.Vector3();

            this.invMass = this.mass > 0 ? 1.0 / this.mass : 0;
            var I = this.inertia;
            var fixed = this.fixedRotation;

            // Approximate with AABB box
            this.computeAABB();
            halfExtents.init(
                (this.aabb.max.x - this.aabb.min.x) / 2,
                (this.aabb.max.y - this.aabb.min.y) / 2,
                (this.aabb.max.z - this.aabb.min.z) / 2
            );
            Box.calculateInertia(halfExtents, this.mass, I);

            this.invInertia.init(
                I.x > 0 && !fixed ? 1.0 / I.x : 0,
                I.y > 0 && !fixed ? 1.0 / I.y : 0,
                I.z > 0 && !fixed ? 1.0 / I.z : 0
            );
            this.updateInertiaWorld(true);
        }

        /**
         * Get world velocity of a point in the body.
         * @method getVelocityAtWorldPoint
         * @param  {Vector3} worldPoint
         * @param  {Vector3} result
         * @return {Vector3} The result vector.
         */
        getVelocityAtWorldPoint(worldPoint: feng3d.Vector3, result = new feng3d.Vector3())
        {
            var r = new feng3d.Vector3();
            worldPoint.subTo(this.position, r);
            this.angularVelocity.crossTo(r, result);
            this.velocity.addTo(result, result);
            return result;
        }

        /**
         * Move the body forward in time.
         * @param dt Time step
         * @param quatNormalize Set to true to normalize the body quaternion
         * @param quatNormalizeFast If the quaternion should be normalized using "fast" quaternion normalization
         */
        integrate(dt: number, quatNormalize: boolean, quatNormalizeFast: boolean)
        {
            // Save previous position
            this.previousPosition.copy(this.position);
            this.previousQuaternion.copy(this.quaternion);

            if (!(this.type === Body.DYNAMIC || this.type === Body.KINEMATIC) || this.sleepState === Body.SLEEPING)
            { // Only for dynamic
                return;
            }

            var velo = this.velocity,
                angularVelo = this.angularVelocity,
                pos = this.position,
                force = this.force,
                torque = this.torque,
                quat = this.quaternion,
                invMass = this.invMass,
                invInertia = this.invInertiaWorld,
                linearFactor = this.linearFactor;

            var iMdt = invMass * dt;
            velo.x += force.x * iMdt * linearFactor.x;
            velo.y += force.y * iMdt * linearFactor.y;
            velo.z += force.z * iMdt * linearFactor.z;

            var e = invInertia.elements;
            var angularFactor = this.angularFactor;
            var tx = torque.x * angularFactor.x;
            var ty = torque.y * angularFactor.y;
            var tz = torque.z * angularFactor.z;
            angularVelo.x += dt * (e[0] * tx + e[1] * ty + e[2] * tz);
            angularVelo.y += dt * (e[3] * tx + e[4] * ty + e[5] * tz);
            angularVelo.z += dt * (e[6] * tx + e[7] * ty + e[8] * tz);

            // Use new velocity  - leap frog
            pos.x += velo.x * dt;
            pos.y += velo.y * dt;
            pos.z += velo.z * dt;

            quat.integrateTo(this.angularVelocity, dt, this.angularFactor, quat);

            if (quatNormalize)
            {
                if (quatNormalizeFast)
                {
                    quat.normalizeFast();
                } else
                {
                    quat.normalize();
                }
            }

            this.aabbNeedsUpdate = true;

            // Update world inertia
            this.updateInertiaWorld();
        }
    }


}
