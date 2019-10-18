namespace CANNON
{
    /**
     * 刚性车
     */
    export class RigidVehicle
    {
        wheelBodies: Body[];
        chassisBody: Body;
        constraints: HingeConstraint[];
        wheelAxes: feng3d.Vector3[];
        wheelForces: number[];

        constructor(chassisBody: Body)
        {
            this.wheelBodies = [];

            this.chassisBody = chassisBody;

            this.constraints = [];
            this.wheelAxes = [];
            this.wheelForces = [];
        }

        /**
         * 添加轮子
         * 
         * @param body 
         * @param position 
         * @param axis 
         */
        addWheel(body: Body, position = new feng3d.Vector3(), axis = new feng3d.Vector3(0, 1, 0))
        {
            this.wheelBodies.push(body);
            this.wheelForces.push(0);

            // 设置底盘的位置
            var worldPosition = this.chassisBody.pointToWorldFrame(position);
            body.position.init(worldPosition.x, worldPosition.y, worldPosition.z);

            this.wheelAxes.push(axis);

            var hingeConstraint = new HingeConstraint(this.chassisBody, body, {
                pivotA: position,
                axisA: axis,
                pivotB: feng3d.Vector3.ZERO,
                axisB: axis,
                collideConnected: false
            });
            this.constraints.push(hingeConstraint);

            return this.wheelBodies.length - 1;
        }

        /**
         * 设置车轮的转向值
         * 
         * @param value
         * @param wheelIndex
         */
        setSteeringValue(value: number, wheelIndex: number)
        {
            var axis = this.wheelAxes[wheelIndex];

            var c = Math.cos(value),
                s = Math.sin(value),
                x = axis.x,
                y = axis.y;
            this.constraints[wheelIndex].axisA.init(
                c * x - s * y,
                s * x + c * y,
                0
            );
        }

        /**
         * Set the target rotational speed of the hinge constraint.
         * 
         * @param value
         * @param wheelIndex
         */
        setMotorSpeed(value: number, wheelIndex: number)
        {
            var hingeConstraint = this.constraints[wheelIndex];
            hingeConstraint.enableMotor();
        }

        /**
         * Set the target rotational speed of the hinge constraint.
         * 
         * @param wheelIndex
         */
        disableMotor(wheelIndex: number)
        {
            var hingeConstraint = this.constraints[wheelIndex];
            hingeConstraint.disableMotor();
        }

        /**
         * Set the wheel force to apply on one of the wheels each time step
         * 
         * @param value
         * @param wheelIndex
         */
        setWheelForce(value: number, wheelIndex: number)
        {
            this.wheelForces[wheelIndex] = value;
        }

        /**
         * Apply a torque on one of the wheels.
         * 
         * @param value
         * @param wheelIndex
         */
        applyWheelForce(value: number, wheelIndex: number)
        {
            var axis = this.wheelAxes[wheelIndex];
            var wheelBody = this.wheelBodies[wheelIndex];
            var bodyTorque = wheelBody.torque;

            var torque = axis.scaleNumberTo(value);
            wheelBody.vectorToWorldFrame(torque, torque);
            bodyTorque.addTo(torque, bodyTorque);
        }

        /**
         * Add the vehicle including its constraints to the world.
         * 
         * @param world
         */
        addToWorld(world: World)
        {
            var constraints = this.constraints;
            var bodies = this.wheelBodies.concat([this.chassisBody]);

            for (var i = 0; i < bodies.length; i++)
            {
                world.addBody(bodies[i]);
            }

            for (var i = 0; i < constraints.length; i++)
            {
                world.addConstraint(constraints[i]);
            }

            world.on('preStep', this._update, this);
        }

        private _update()
        {
            var wheelForces = this.wheelForces;
            for (var i = 0; i < wheelForces.length; i++)
            {
                this.applyWheelForce(wheelForces[i], i);
            }
        }

        /**
         * Remove the vehicle including its constraints from the world.
         * @param world
         */
        removeFromWorld(world: World)
        {
            var constraints = this.constraints;
            var bodies = this.wheelBodies.concat([this.chassisBody]);

            for (var i = 0; i < bodies.length; i++)
            {
                world.removeBody(bodies[i]);
            }

            for (var i = 0; i < constraints.length; i++)
            {
                world.removeConstraint(constraints[i]);
            }
        }

        /**
         * Get current rotational velocity of a wheel
         * 
         * @param wheelIndex
         */
        getWheelSpeed(wheelIndex: number)
        {
            var axis = this.wheelAxes[wheelIndex];
            var wheelBody = this.wheelBodies[wheelIndex];
            var w = wheelBody.angularVelocity;

            var worldAxis = this.chassisBody.vectorToWorldFrame(axis);
            return w.dot(worldAxis);
        }
    }
}