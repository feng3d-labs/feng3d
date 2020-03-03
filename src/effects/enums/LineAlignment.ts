namespace feng3d
{
    /**
     * Control the direction lines face, when using the LineRenderer or TrailRenderer.
     * 
     * 使用LineRenderer或TrailRenderer时，控制方向线的面。
     */
    export enum LineAlignment
    {

        /**
         * Lines face the camera.
         * 
         * 线面向相机。
         */
        View,
        /**
         * Lines face the Z axis of the Transform Component.
         * 
         * 线面向变换组件的Z轴。
         */
        TransformZ
    }
}