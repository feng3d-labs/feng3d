namespace CANNON
{
    export class RotationalEquation extends Equation
    {
        axisA: feng3d.Vector3;
        axisB: feng3d.Vector3;

        maxAngle: number;

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

            this.maxAngle = Math.PI / 2;
        }

        computeB(h: number)
        {
            var a = this.a,
                b = this.b,

                ni = this.axisA,
                nj = this.axisB,

                nixnj = tmpVec1,
                njxni = tmpVec2,

                GA = this.jacobianElementA,
                GB = this.jacobianElementB;

            // Caluclate cross products
            ni.crossTo(nj, nixnj);
            nj.crossTo(ni, njxni);

            // g = ni * nj
            // gdot = (nj x ni) * wi + (ni x nj) * wj
            // G = [0 njxni 0 nixnj]
            // W = [vi wi vj wj]
            GA.rotational.copy(njxni);
            GB.rotational.copy(nixnj);

            var g = Math.cos(this.maxAngle) - ni.dot(nj),
                GW = this.computeGW(),
                GiMf = this.computeGiMf();

            var B = - g * a - GW * b - h * GiMf;

            return B;
        }

    }

    var tmpVec1 = new feng3d.Vector3();
    var tmpVec2 = new feng3d.Vector3();
}