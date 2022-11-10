export enum CameraClearFlags
{
    /**
     * Clear with the skybox.
     */
    Skybox = 1,

    /**
     * Clear with a background color.
     */
    SolidColor = 2,

    /**
     * Clear only the depth buffer.
     */
    Depth = 3,

    /**
     * Don't clear anything.
     */
    Nothing = 4,
}
