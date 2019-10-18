namespace CANNON
{
    export class ConeEquation extends Equation
    {
        axisA: feng3d.Vector3;
        axisB: feng3d.Vector3;
        /**
         * The cone angle to keep
         */
        angle: number

        /**
         * Cone equation. Works to keep the given body world vectors aligned, or tilted within a given angle from each other.
         * 
         * @param bodyA 
         * @param bodyB 
         * @param options 
         * 
         * @author schteppe
         */
        constructor(bodyA: Body, bodyB: Body, maxForce = 1e6, axisA = new feng3d.Vector3(1, 0, 0), axisB = new feng3d.Vector3(0, 1, 0), angle = 0)
        {
            super(bodyA, bodyB, maxForce, maxForce);

            this.axisA = axisA.clone();
            this.axisB = axisB.clone();

            this.angle = angle;
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

            var g = Math.cos(this.angle) - ni.dot(nj),
                GW = this.computeGW(),
                GiMf = this.computeGiMf();

            var B = - g * a - GW * b - h * GiMf;

            return B;
        }

    }
}