namespace CANNON
{
    /**
     * 约束
     */
    export class Constraint
    {
        /**
         * 方程组
         */
        equations: Equation[];

        /**
         * 关联的两个物体是否发生碰撞
         */
        collideConnected: boolean;

        /**
         * 物体A
         */
        bodyA: Body;

        /**
         * 物体B
         */
        bodyB: Body;

        /**
         * 
         * @param bodyA 
         * @param bodyB 
         * @param collideConnected 
         * @param wakeUpBodies 
         */
        constructor(bodyA: Body, bodyB: Body, collideConnected = true, wakeUpBodies = true)
        {
            this.equations = [];

            this.bodyA = bodyA;

            this.bodyB = bodyB;

            this.collideConnected = collideConnected;

            if (wakeUpBodies)
            {
                if (bodyA)
                {
                    bodyA.wakeUp();
                }
                if (bodyB)
                {
                    bodyB.wakeUp();
                }
            }
        }

        /**
         * 更新所有方程
         */
        update()
        {
            throw new Error("method update() not implmemented in this Constraint subclass!");
        }

        /**
         * 启用所有方程
         */
        enable()
        {
            var eqs = this.equations;
            for (var i = 0; i < eqs.length; i++)
            {
                eqs[i].enabled = true;
            }
        }

        /**
         * 禁用所有方程
         */
        disable()
        {
            var eqs = this.equations;
            for (var i = 0; i < eqs.length; i++)
            {
                eqs[i].enabled = false;
            }
        }
    }
}