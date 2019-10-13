namespace CANNON
{
    /**
     * 求解器
     */
    export abstract class Solver
    {
        /**
         * 求解的方程数组
         */
        equations: Equation[];

        /**
         * 约束方程求解器基类
         */
        constructor()
        {
            this.equations = [];
        }

        /**
         * 求解
         * 
         * @param dt
         * @param world
         */
        abstract solve(dt: number, world: World): number;

        /**
         * 添加方程
         * 
         * @param eq
         */
        addEquation(eq: Equation)
        {
            if (eq.enabled)
            {
                this.equations.push(eq);
            }
        }

        /**
         * 移除方程式
         * 
         * @param eq
         */
        removeEquation(eq: Equation)
        {
            var eqs = this.equations;
            var i = eqs.indexOf(eq);
            if (i !== -1)
            {
                eqs.splice(i, 1);
            }
        }

        /**
         * 移除所有方程式
         */
        removeAllEquations()
        {
            this.equations.length = 0;
        }

    }
}