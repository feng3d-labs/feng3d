namespace CANNON
{
    export class ConeTwistConstraint extends PointToPointConstraint
    {
        axisA: feng3d.Vector3;
        axisB: feng3d.Vector3;
        angle: number;
        coneEquation: ConeEquation;
        twistEquation: RotationalEquation;
        twistAngle: number;

        /**
         * @class ConeTwistConstraint
         * 
         * @param bodyA 
         * @param bodyB 
         * @param options 
         * 
         * @author schteppe
         */
        constructor(bodyA: Body, bodyB: Body, options: {
            pivotA?: feng3d.Vector3, pivotB?: feng3d.Vector3, maxForce?: number, axisA?: feng3d.Vector3, axisB?: feng3d.Vector3,
            collideConnected?: boolean, angle?: number, twistAngle?: number
        } = {})
        {
            super(bodyA, options.pivotA ? options.pivotA.clone() : new feng3d.Vector3(), bodyB, options.pivotB ? options.pivotB.clone() : new feng3d.Vector3(),
                typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6);

            this.axisA = options.axisA ? options.axisA.clone() : new feng3d.Vector3();
            this.axisB = options.axisB ? options.axisB.clone() : new feng3d.Vector3();

            var maxForce = typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6;

            this.collideConnected = !!options.collideConnected;

            this.angle = typeof (options.angle) !== 'undefined' ? options.angle : 0;

            /**
             * @property {ConeEquation} coneEquation
             */
            var c = this.coneEquation = new ConeEquation(bodyA, bodyB, options);

            /**
             * @property {RotationalEquation} twistEquation
             */
            var t = this.twistEquation = new RotationalEquation(bodyA, bodyB, options);
            this.twistAngle = typeof (options.twistAngle) !== 'undefined' ? options.twistAngle : 0;

            // Make the cone equation push the bodies toward the cone axis, not outward
            c.maxForce = 0;
            c.minForce = -maxForce;

            // Make the twist equation add torque toward the initial position
            t.maxForce = 0;
            t.minForce = -maxForce;

            this.equations.push(c, t);
        }

        update()
        {
            var bodyA = this.bodyA,
                bodyB = this.bodyB,
                cone = this.coneEquation,
                twist = this.twistEquation;

            super.update();

            // Update the axes to the cone constraint
            bodyA.vectorToWorldFrame(this.axisA, cone.axisA);
            bodyB.vectorToWorldFrame(this.axisB, cone.axisB);

            // Update the world axes in the twist constraint
            this.axisA.tangents(twist.axisA, twist.axisA);
            bodyA.vectorToWorldFrame(twist.axisA, twist.axisA);

            this.axisB.tangents(twist.axisB, twist.axisB);
            bodyB.vectorToWorldFrame(twist.axisB, twist.axisB);

            cone.angle = this.angle;
            twist.maxAngle = this.twistAngle;
        }

    }

}