namespace CANNON
{
    export class ContactEquation extends Equation
    {
        restitution = 0.0; // "bounciness": u1 = -e*u0

        /**
         * World-oriented vector that goes from the center of bi to the contact point.
         */
        ri = new feng3d.Vector3();

        /**
         * World-oriented vector that starts in body j position and goes to the contact point.
         */
        rj = new feng3d.Vector3();

        /**
         * Contact normal, pointing out of body i.
         */
        ni = new feng3d.Vector3();

        si: Shape;
        sj: Shape;

        /**
         * Contact/non-penetration constraint equation
         * 
         * @param bodyA
         * @param bodyB
         * 
         * @author schteppe
         */
        constructor(bodyA: Body, bodyB: Body, maxForce = 1e6)
        {
            super(bodyA, bodyB, 0, maxForce);
        }

        computeB(h: number)
        {
            var a = this.a,
                b = this.b,
                bi = this.bi,
                bj = this.bj,
                ri = this.ri,
                rj = this.rj,

                vi = bi.velocity,
                wi = bi.angularVelocity,

                vj = bj.velocity,
                wj = bj.angularVelocity,

                penetrationVec = new feng3d.Vector3(),

                GA = this.jacobianElementA,
                GB = this.jacobianElementB,

                n = this.ni;

            // Caluclate cross products
            var rixn = ri.crossTo(n);
            var rjxn = rj.crossTo(n);

            // g = xj+rj -(xi+ri)
            // G = [ -ni  -rixn  ni  rjxn ]
            n.negateTo(GA.spatial);
            rixn.negateTo(GA.rotational);
            GB.spatial.copy(n);
            GB.rotational.copy(rjxn);

            // Calculate the penetration vector
            penetrationVec.copy(bj.position);
            penetrationVec.addTo(rj, penetrationVec);
            penetrationVec.subTo(bi.position, penetrationVec);
            penetrationVec.subTo(ri, penetrationVec);

            var g = n.dot(penetrationVec);

            // Compute iteration
            var ePlusOne = this.restitution + 1;
            var GW = ePlusOne * vj.dot(n) - ePlusOne * vi.dot(n) + wj.dot(rjxn) - wi.dot(rixn);
            var GiMf = this.computeGiMf();

            var B = - g * a - GW * b - h * GiMf;

            return B;
        }

        /**
         * Get the current relative velocity in the contact point.
         */
        getImpactVelocityAlongNormal()
        {

            var xi = this.bi.position.addTo(this.ri);
            var xj = this.bj.position.addTo(this.rj);

            var vi = this.bi.getVelocityAtWorldPoint(xi);
            var vj = this.bj.getVelocityAtWorldPoint(xj);

            var relVel = vi.subTo(vj);

            return this.ni.dot(relVel);
        }

    }
}