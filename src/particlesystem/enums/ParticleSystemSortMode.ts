namespace feng3d
{
    /**
     * The sorting mode for particle systems.
     */
    export enum ParticleSystemSortMode
    {
        /**
         * No sorting.
         */
        None,

        /**
         * Sort based on distance.
         */
        Distance,

        /**
         * Sort the oldest particles to the front.
         */
        OldestInFront,

        /**
         * Sort the youngest particles to the front.
         */
        YoungestInFront,

    }
}