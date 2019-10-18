namespace CANNON
{
    /**
     * 方程式
     */
    export class Equation
    {
        /**
         * 最小力
         */
        minForce: number;

        /**
         * 最大力
         */
        maxForce: number;

        bi: Body;

        bj: Body;

        a = 0.0;

        b = 0.0;

        /**
         * SPOOK parameter
         */
        eps = 0.0;

        jacobianElementA = new JacobianElement();

        jacobianElementB = new JacobianElement();

        /**
         * 是否启用
         */
        enabled = true;

        /**
         * 
         * @param bi 
         * @param bj 
         * @param minForce 
         * @param maxForce 
         */
        constructor(bi: Body, bj: Body, minForce = -1e6, maxForce = 1e6)
        {
            this.minForce = minForce;
            this.maxForce = maxForce;
            this.bi = bi;
            this.bj = bj;

            // Set typical spook params
            this.setSpookParams(1e7, 4, 1 / 60);
        }

        /**
         * Recalculates a,b,eps.
         */
        setSpookParams(stiffness: number, relaxation: number, timeStep: number)
        {
            var d = relaxation,
                k = stiffness,
                h = timeStep;
            this.a = 4.0 / (h * (1 + 4 * d));
            this.b = (4.0 * d) / (1 + 4 * d);
            this.eps = 4.0 / (h * h * k * (1 + 4 * d));
        }

        /**
         * Computes the RHS of the SPOOK equation
         */
        computeB(a: number, b: number, h: number)
        {
            var GW = this.computeGW(),
                Gq = this.computeGq(),
                GiMf = this.computeGiMf();
            return - Gq * a - GW * b - GiMf * h;
        }

        /**
         * Computes G*q, where q are the generalized body coordinates
         */
        computeGq()
        {
            var GA = this.jacobianElementA,
                GB = this.jacobianElementB,
                bi = this.bi,
                bj = this.bj,
                xi = bi.position,
                xj = bj.position;
            return GA.spatial.dot(xi) + GB.spatial.dot(xj);
        }


        /**
         * Computes G*W, where W are the body velocities
         */
        computeGW()
        {
            var GA = this.jacobianElementA,
                GB = this.jacobianElementB,
                bi = this.bi,
                bj = this.bj,
                vi = bi.velocity,
                vj = bj.velocity,
                wi = bi.angularVelocity,
                wj = bj.angularVelocity;
            return GA.multiplyVectors(vi, wi) + GB.multiplyVectors(vj, wj);
        }


        /**
         * Computes G*Wlambda, where W are the body velocities
         */
        computeGWlambda()
        {
            var GA = this.jacobianElementA,
                GB = this.jacobianElementB,
                bi = this.bi,
                bj = this.bj,
                vi = bi.vlambda,
                vj = bj.vlambda,
                wi = bi.wlambda,
                wj = bj.wlambda;
            return GA.multiplyVectors(vi, wi) + GB.multiplyVectors(vj, wj);
        }

        /**
         * Computes G*inv(M)*f, where M is the mass matrix with diagonal blocks for each body, and f are the forces on the bodies.
         */
        computeGiMf()
        {
            var GA = this.jacobianElementA,
                GB = this.jacobianElementB,
                bi = this.bi,
                bj = this.bj,
                fi = bi.force,
                ti = bi.torque,
                fj = bj.force,
                tj = bj.torque,
                invMassi = bi.invMassSolve,
                invMassj = bj.invMassSolve;

            var iMfi = fi.scaleNumberTo(invMassi);
            var iMfj = fj.scaleNumberTo(invMassj);

            var invIi_vmult_taui = bi.invInertiaWorldSolve.vmult(ti);
            var invIj_vmult_tauj = bj.invInertiaWorldSolve.vmult(tj);

            return GA.multiplyVectors(iMfi, invIi_vmult_taui) + GB.multiplyVectors(iMfj, invIj_vmult_tauj);
        }

        /**
         * Computes G*inv(M)*G'
         */
        computeGiMGt()
        {
            var GA = this.jacobianElementA,
                GB = this.jacobianElementB,
                bi = this.bi,
                bj = this.bj,
                invMassi = bi.invMassSolve,
                invMassj = bj.invMassSolve,
                invIi = bi.invInertiaWorldSolve,
                invIj = bj.invInertiaWorldSolve,
                result = invMassi + invMassj;

            var tmp = invIi.vmult(GA.rotational);
            result += tmp.dot(GA.rotational);

            invIj.vmult(GB.rotational, tmp);
            result += tmp.dot(GB.rotational);

            return result;
        }

        /**
         * Add constraint velocity to the bodies.
         */
        addToWlambda(deltalambda: number)
        {
            var GA = this.jacobianElementA,
                GB = this.jacobianElementB,
                bi = this.bi,
                bj = this.bj,
                temp = new feng3d.Vector3();



            // Add to linear velocity
            // v_lambda += inv(M) * delta_lamba * G

            bi.vlambda.addTo(GA.spatial.scaleNumberTo(bi.invMassSolve * deltalambda), bi.vlambda);
            bj.vlambda.addTo(GB.spatial.scaleNumberTo(bj.invMassSolve * deltalambda), bj.vlambda);

            // Add to angular velocity
            bi.invInertiaWorldSolve.vmult(GA.rotational, temp);
            bi.wlambda.addTo(temp.scaleNumberTo(deltalambda), bi.wlambda);

            bj.invInertiaWorldSolve.vmult(GB.rotational, temp);
            bj.wlambda.addTo(temp.scaleNumberTo(deltalambda), bj.wlambda);
        }

        /**
         * Compute the denominator part of the SPOOK equation: C = G*inv(M)*G' + eps
         */
        computeC()
        {
            return this.computeGiMGt() + this.eps;
        }
    }

}