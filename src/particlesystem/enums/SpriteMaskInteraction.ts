/**
 * This enum controls the mode under which the sprite will interact with the masking system.
 *
 * Sprites by default do not interact with masks SpriteMaskInteraction.None. A sprite can also be setup to be visible in presence of one or more masks SpriteMaskInteraction.VisibleInsideMask or to be visible on areas where no masks are present SpriteMaskInteraction.VisibleOutsideMask.
 */
export enum SpriteMaskInteraction
{

    /**
     * The sprite will not interact with the masking system.
     */
    None,

    /**
     * The sprite will be visible only in areas where a mask is present.
     */
    VisibleInsideMask,

    /**
     * The sprite will be visible only in areas where no mask is present.
     */
    VisibleOutsideMask,

}
