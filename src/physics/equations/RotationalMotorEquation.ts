namespace CANNON
{
    export class RotationalMotorEquation extends Equation
    {

        /**
         * World oriented rotational axis
         */
        axisA: feng3d.Vector3;

        /**
         * World oriented rotational axis
         */
        axisB: feng3d.Vector3; // World oriented rotational axis

        /**
         * Motor velocity
         */
        targetVelocity: number;

        /**
         * Rotational motor constraint. Tries to keep the relative angular velocity of the bodies to a given value.
         * 
         * @param bodyA 
         * @param bodyB 
         * @param maxForce 
         */
        constructor(bodyA: Body, bodyB: Body, maxForce = 1e6)
        {
            super(bodyA, bodyB, -maxForce, maxForce);

            this.axisA = new feng3d.Vector3();
            this.axisB = new feng3d.Vector3(); // World oriented rotational axis
            this.targetVelocity = 0;
        }

        computeB(h: number)
        {
            var b = this.b,

                axisA = this.axisA,
                axisB = this.axisB,

                GA = this.jacobianElementA,
                GB = this.jacobianElementB;

            GA.rotational.copy(axisA);
            axisB.negateTo(GB.rotational);

            var GW = this.computeGW() - this.targetVelocity,
                GiMf = this.computeGiMf();

            var B = - GW * b - h * GiMf;

            return B;
        }
    }
}