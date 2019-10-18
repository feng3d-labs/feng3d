namespace CANNON
{
    export class FrictionEquation extends Equation
    {
        ri = new feng3d.Vector3();
        rj = new feng3d.Vector3();
        t = new feng3d.Vector3(); // tangent

        /**
         * 
         * @param bodyA 
         * @param bodyB 
         * @param slipForce 
         */
        constructor(bodyA: Body, bodyB: Body, slipForce: number)
        {
            super(bodyA, bodyB, -slipForce, slipForce);
        }

        computeB(h: number)
        {
            var b = this.b,
                ri = this.ri,
                rj = this.rj,
                t = this.t;

            // Caluclate cross products
            var rixt = ri.crossTo(t);
            var rjxt = rj.crossTo(t);

            // G = [-t -rixt t rjxt]
            // And remember, this is a pure velocity constraint, g is always zero!
            var GA = this.jacobianElementA,
                GB = this.jacobianElementB;
            t.negateTo(GA.spatial);
            rixt.negateTo(GA.rotational);
            GB.spatial.copy(t);
            GB.rotational.copy(rjxt);

            var GW = this.computeGW();
            var GiMf = this.computeGiMf();

            var B = - GW * b - h * GiMf;

            return B;
        }
    }
}