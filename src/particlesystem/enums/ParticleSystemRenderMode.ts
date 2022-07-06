namespace feng3d
{
    export enum ParticleSystemRenderMode
    {
        /**
         * Render particles as billboards facing the active camera. (Default)
         */
        Billboard = 0,

        /**
         * Stretch particles in the direction of motion.
         */
        Stretch = 1,

        /**
         * Render particles as billboards always facing up along the y-Axis.
         */
        HorizontalBillboard = 2,

        /**
         * Render particles as billboards always facing the player, but not pitching along the x-Axis.
        
         */
        VerticalBillboard = 3,

        /**
         * Render particles as meshes.
         */
        Mesh = 4,

        /**
         * Do not render particles.
         */
        None = 5,
    }
}