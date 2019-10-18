namespace CANNON
{
    export class ContactMaterial
    {

        /**
         * Participating materials
         * @todo  Should be .materialA and .materialB instead
         */
        materials: Material[];

        /**
         * Friction coefficient
         */
        friction = 0.3;

        /**
         * Restitution coefficient
         */
        restitution = 0.3;

        /**
         * Stiffness of the produced contact equations
         */
        contactEquationStiffness = 1e7;

        /**
         * Relaxation time of the produced contact equations
         */
        contactEquationRelaxation = 3;

        /**
         * Stiffness of the produced friction equations
         */
        frictionEquationStiffness = 1e7;

        /**
         * Relaxation time of the produced friction equations
         */
        frictionEquationRelaxation = 3;

        /**
         * Defines what happens when two materials meet.
         * 
         * @param m1 
         * @param m2 
         * @param options 
         */
        constructor(m1: Material, m2: Material, friction = 0.3, restitution = 0.0)
        {
            this.materials = [m1, m2];
            this.friction = friction;
            this.restitution = restitution;
        }
    }
}