namespace CANNON
{
    /**
     * 点到点约束
     */
    export class PointToPointConstraint extends Constraint
    {
        /**
         * 物体A的中心点
         */
        pivotA: feng3d.Vector3;
        /**
         * 物体B的中心点
         */
        pivotB: feng3d.Vector3;
        equationX: ContactEquation;
        equationY: ContactEquation;
        equationZ: ContactEquation;

        /**
         * Connects two bodies at given offset points.
         * 
         * @param bodyA
         * @param pivotA The point relative to the center of mass of bodyA which bodyA is constrained to.
         * @param bodyB Body that will be constrained in a similar way to the same point as bodyA. We will therefore get a link between bodyA and bodyB. If not specified, bodyA will be constrained to a static point.
         * @param pivotB See pivotA.
         * @param maxForce The maximum force that should be applied to constrain the bodies.
         *
         * @example
         *     var bodyA = new Body({ mass: 1 });
         *     var bodyB = new Body({ mass: 1 });
         *     bodyA.position.set(-1, 0, 0);
         *     bodyB.position.set(1, 0, 0);
         *     bodyA.addShape(shapeA);
         *     bodyB.addShape(shapeB);
         *     world.addBody(bodyA);
         *     world.addBody(bodyB);
         *     var localPivotA = new Vec3(1, 0, 0);
         *     var localPivotB = new Vec3(-1, 0, 0);
         *     var constraint = new PointToPointConstraint(bodyA, localPivotA, bodyB, localPivotB);
         *     world.addConstraint(constraint);
         */
        constructor(bodyA: Body, pivotA = new feng3d.Vector3(), bodyB: Body, pivotB = new feng3d.Vector3(), maxForce = 1e6)
        {
            super(bodyA, bodyB);

            this.pivotA = pivotA.clone();

            this.pivotB = pivotB.clone();

            var x = this.equationX = new ContactEquation(bodyA, bodyB);

            var y = this.equationY = new ContactEquation(bodyA, bodyB);

            var z = this.equationZ = new ContactEquation(bodyA, bodyB);

            // Equations to be fed to the solver
            this.equations.push(x, y, z);

            // Make the equations bidirectional
            x.minForce = y.minForce = z.minForce = -maxForce;
            x.maxForce = y.maxForce = z.maxForce = maxForce;

            x.ni.init(1, 0, 0);
            y.ni.init(0, 1, 0);
            z.ni.init(0, 0, 1);
        }

        update()
        {
            var bodyA = this.bodyA;
            var bodyB = this.bodyB;
            var x = this.equationX;
            var y = this.equationY;
            var z = this.equationZ;

            // Rotate the pivots to world space
            bodyA.quaternion.rotatePoint(this.pivotA, x.ri);
            bodyB.quaternion.rotatePoint(this.pivotB, x.rj);

            y.ri.copy(x.ri);
            y.rj.copy(x.rj);
            z.ri.copy(x.ri);
            z.rj.copy(x.rj);
        }
    }
}