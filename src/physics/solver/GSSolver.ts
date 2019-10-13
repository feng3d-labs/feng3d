namespace CANNON
{
    /**
     * 约束方程 Gauss-Seidel 求解器
     */
    export class GSSolver extends Solver
    {
        /**
         * 求解器迭代的次数
         * 
         * 求解器迭代的次数决定了约束条件的质量。迭代越多，模拟就越正确。然而，更多的迭代需要更多的计算。如果你的世界有很大的重力，你将需要更多的迭代。
         */
        iterations: number;

        /**
         * 容差
         * 
         * 当达到容差时，假定系统是收敛的。
         */
        tolerance: number;

        constructor()
        {
            super();

            this.iterations = 10;
            this.tolerance = 1e-7;
        }

        solve(dt: number, world: World)
        {
            var iter = 0,
                maxIter = this.iterations,
                tolSquared = this.tolerance * this.tolerance,
                equations = this.equations,
                Neq = equations.length,
                bodies = world.bodies,
                Nbodies = bodies.length,
                h = dt,
                B: number, invC: number, deltalambda: number, deltalambdaTot: number, GWlambda: number, lambdaj: number;

            // Update solve mass
            if (Neq !== 0)
            {
                for (var i = 0; i !== Nbodies; i++)
                {
                    bodies[i].updateSolveMassProperties();
                }
            }

            // Things that does not change during iteration can be computed once
            var invCs = [],
                Bs = [],
                lambda = [];
            invCs.length = Neq;
            Bs.length = Neq;
            lambda.length = Neq;
            for (var i = 0; i !== Neq; i++)
            {
                var c = equations[i];
                lambda[i] = 0.0;
                Bs[i] = c.computeB(h, 0, 0);
                invCs[i] = 1.0 / c.computeC();
            }

            if (Neq !== 0)
            {

                // Reset vlambda
                for (var i = 0; i !== Nbodies; i++)
                {
                    var b = bodies[i],
                        vlambda = b.vlambda,
                        wlambda = b.wlambda;
                    vlambda.init(0, 0, 0);
                    wlambda.init(0, 0, 0);
                }

                // Iterate over equations
                for (iter = 0; iter !== maxIter; iter++)
                {

                    // Accumulate the total error for each iteration.
                    deltalambdaTot = 0.0;

                    for (var j = 0; j !== Neq; j++)
                    {

                        var c = equations[j];

                        // Compute iteration
                        B = Bs[j];
                        invC = invCs[j];
                        lambdaj = lambda[j];
                        GWlambda = c.computeGWlambda();
                        deltalambda = invC * (B - GWlambda - c.eps * lambdaj);

                        // Clamp if we are not within the min/max interval
                        if (lambdaj + deltalambda < c.minForce)
                        {
                            deltalambda = c.minForce - lambdaj;
                        } else if (lambdaj + deltalambda > c.maxForce)
                        {
                            deltalambda = c.maxForce - lambdaj;
                        }
                        lambda[j] += deltalambda;

                        deltalambdaTot += deltalambda > 0.0 ? deltalambda : -deltalambda; // abs(deltalambda)

                        c.addToWlambda(deltalambda);
                    }

                    // If the total error is small enough - stop iterate
                    if (deltalambdaTot * deltalambdaTot < tolSquared)
                    {
                        break;
                    }
                }

                // Add result to velocity
                for (var i = 0; i !== Nbodies; i++)
                {
                    var b = bodies[i],
                        v = b.velocity,
                        w = b.angularVelocity;

                    b.vlambda.scaleTo(b.linearFactor, b.vlambda);
                    v.addTo(b.vlambda, v);

                    b.wlambda.scaleTo(b.angularFactor, b.wlambda);
                    w.addTo(b.wlambda, w);
                }

                // Set the .multiplier property of each equation
                var l = equations.length;
                var invDt = 1 / h;
                while (l--)
                {
                    equations[l].multiplier = lambda[l] * invDt;
                }
            }

            return iter;
        }

    }
}