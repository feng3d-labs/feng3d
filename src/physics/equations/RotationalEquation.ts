namespace CANNON
{
    export class RotationalEquation extends Equation
    {
        axisA: feng3d.Vector3;
        axisB: feng3d.Vector3;

        maxAngle = Math.PI / 2;

        /**
         * Rotational constraint. Works to keep the local vectors orthogonal to each other in world space.
         * 
         * @param bodyA 
         * @param bodyB 
         * @param options 
         * 
         * @author schteppe
         */
        constructor(bodyA: Body, bodyB: Body, axisA = new feng3d.Vector3(1, 0, 0), axisB = new feng3d.Vector3(0, 1, 0), maxForce = 1e6)
        {
            super(bodyA, bodyB, -maxForce, maxForce);

            this.axisA = axisA.clone();
            this.axisB = axisB.clone();
        }

        computeB(h: number)
        {
            var a = this.a,
                b = this.b,

                ni = this.axisA,
                nj = this.axisB,

                GA = this.jacobianElementA,
                GB = this.jacobianElementB;

            // Caluclate cross products
            var nixnj = ni.crossTo(nj);
            var njxni = nj.crossTo(ni);

            GA.rotational.copy(njxni);
            GB.rotational.copy(nixnj);

            var g = Math.cos(this.maxAngle) - ni.dot(nj),
                GW = this.computeGW(),
                GiMf = this.computeGiMf();

            var B = - g * a - GW * b - h * GiMf;

            return B;
        }

    }
}