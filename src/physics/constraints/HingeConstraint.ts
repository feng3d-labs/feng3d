namespace CANNON
{
    export class HingeConstraint extends PointToPointConstraint
    {
        /**
         * Rotation axis, defined locally in bodyA.
         */
        axisA: feng3d.Vector3;
        /**
         * Rotation axis, defined locally in bodyB.
         */
        axisB: feng3d.Vector3;
        rotationalEquation1: RotationalEquation;
        rotationalEquation2: RotationalEquation;
        motorEquation: RotationalMotorEquation;
        /**
         * Equations to be fed to the solver
         */
        equations: Equation[];

        /**
         * Hinge constraint. Think of it as a door hinge. It tries to keep the door in the correct place and with the correct orientation.
         * 
         * @param bodyA 
         * @param bodyB 
         * @param options 
         * 
         * @author schteppe
         */
        constructor(bodyA: Body, bodyB: Body, pivotA = new feng3d.Vector3(), pivotB = new feng3d.Vector3(), axisA = new feng3d.Vector3(1, 0, 0), axisB = new feng3d.Vector3(1, 0, 0), maxForce = 1e6)
        {
            super(bodyA, pivotA, bodyB, pivotB, maxForce);

            axisA = this.axisA = axisA.clone();
            axisA.normalize();

            axisB = this.axisB = axisB.clone();
            axisB.normalize();

            var r1 = this.rotationalEquation1 = new RotationalEquation(bodyA, bodyB, axisA, axisB, maxForce);

            var r2 = this.rotationalEquation2 = new RotationalEquation(bodyA, bodyB, axisA, axisB, maxForce);

            var motor = this.motorEquation = new RotationalMotorEquation(bodyA, bodyB, maxForce);
            motor.enabled = false; // Not enabled by default

            // Equations to be fed to the solver
            this.equations.push(r1, r2, motor);
        }

        enableMotor()
        {
            this.motorEquation.enabled = true;
        }

        disableMotor()
        {
            this.motorEquation.enabled = false;
        }

        setMotorSpeed(speed: number)
        {
            this.motorEquation.targetVelocity = speed;
        }

        setMotorMaxForce(maxForce: number)
        {
            this.motorEquation.maxForce = maxForce;
            this.motorEquation.minForce = -maxForce;
        }

        update()
        {
            var bodyA = this.bodyA,
                bodyB = this.bodyB,
                motor = this.motorEquation,
                r1 = this.rotationalEquation1,
                r2 = this.rotationalEquation2,
                worldAxisA = new feng3d.Vector3();

            var axisA = this.axisA;
            var axisB = this.axisB;

            super.update();

            // Get world axes
            var worldAxisA = bodyA.quaternion.rotatePoint(axisA);
            var worldAxisB = bodyB.quaternion.rotatePoint(axisB);

            worldAxisA.tangents(r1.axisA, r2.axisA);
            r1.axisB.copy(worldAxisB);
            r2.axisB.copy(worldAxisB);

            if (this.motorEquation.enabled)
            {
                bodyA.quaternion.rotatePoint(this.axisA, motor.axisA);
                bodyB.quaternion.rotatePoint(this.axisB, motor.axisB);
            }
        }
    }
}