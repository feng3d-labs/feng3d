namespace feng3d
{
    /**
     * 图片组件
     */
    export class UIImage extends Behaviour
    {
        /**
         * The source texture of the Image element.
         * 
         * 图像元素的源纹理。
         */
        image: Texture2D;

        /**
         * Tinting color for this Image.
         * 
         * 为该图像着色。
         */
        color = new Color4();
    }
}