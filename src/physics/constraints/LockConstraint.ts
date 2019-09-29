namespace CANNON
{
    export class LockConstraint extends PointToPointConstraint
    {
        xA: feng3d.Vector3;
        xB: any;
        yA: feng3d.Vector3;
        yB: any;
        zA: feng3d.Vector3;
        zB: any;
        rotationalEquation1: RotationalEquation;
        rotationalEquation2: RotationalEquation;
        rotationalEquation3: RotationalEquation;
        motorEquation: any;

        /**
         * Lock constraint. Will remove all degrees of freedom between the bodies.
         * 
         * @param bodyA 
         * @param bodyB 
         * @param options 
         * 
         * @author schteppe
         */
        constructor(bodyA: Body, bodyB: Body, options: { maxForce?: number } = {})
        {
            // The point-to-point constraint will keep a point shared between the bodies
            super(bodyA, new feng3d.Vector3(), bodyB, new feng3d.Vector3(), typeof (options.maxForce) !== 'undefined' ? options.maxForce : 1e6);

            // Set pivot point in between
            var pivotA = this.pivotA;
            var pivotB = this.pivotB;
            var halfWay = new feng3d.Vector3();
            bodyA.position.addTo(bodyB.position, halfWay);
            halfWay.scaleNumberTo(0.5, halfWay);
            bodyB.pointToLocalFrame(halfWay, pivotB);
            bodyA.pointToLocalFrame(halfWay, pivotA);

            // Store initial rotation of the bodies as unit vectors in the local body spaces
            this.xA = bodyA.vectorToLocalFrame(feng3d.Vector3.X_AXIS);
            this.xB = bodyB.vectorToLocalFrame(feng3d.Vector3.X_AXIS);
            this.yA = bodyA.vectorToLocalFrame(feng3d.Vector3.Y_AXIS);
            this.yB = bodyB.vectorToLocalFrame(feng3d.Vector3.Y_AXIS);
            this.zA = bodyA.vectorToLocalFrame(feng3d.Vector3.Z_AXIS);
            this.zB = bodyB.vectorToLocalFrame(feng3d.Vector3.Z_AXIS);

            // ...and the following rotational equations will keep all rotational DOF's in place

            var r1 = this.rotationalEquation1 = new RotationalEquation(bodyA, bodyB, options);

            var r2 = this.rotationalEquation2 = new RotationalEquation(bodyA, bodyB, options);

            var r3 = this.rotationalEquation3 = new RotationalEquation(bodyA, bodyB, options);

            this.equations.push(r1, r2, r3);
        }

        update()
        {
            var bodyA = this.bodyA,
                bodyB = this.bodyB,
                motor = this.motorEquation,
                r1 = this.rotationalEquation1,
                r2 = this.rotationalEquation2,
                r3 = this.rotationalEquation3,
                worldAxisA = LockConstraint_update_tmpVec1,
                worldAxisB = LockConstraint_update_tmpVec2;

            super.update();

            // These vector pairs must be orthogonal
            bodyA.vectorToWorldFrame(this.xA, r1.axisA);
            bodyB.vectorToWorldFrame(this.yB, r1.axisB);

            bodyA.vectorToWorldFrame(this.yA, r2.axisA);
            bodyB.vectorToWorldFrame(this.zB, r2.axisB);

            bodyA.vectorToWorldFrame(this.zA, r3.axisA);
            bodyB.vectorToWorldFrame(this.xB, r3.axisB);
        };

    }

    var LockConstraint_update_tmpVec1 = new feng3d.Vector3();
    var LockConstraint_update_tmpVec2 = new feng3d.Vector3();

}