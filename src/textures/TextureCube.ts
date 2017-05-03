module feng3d
{

    /**
     * 立方体纹理
     * @author feng 2016-12-28
     */
    export class TextureCube extends TextureInfo
    {
        protected _pixels: HTMLImageElement[];

        constructor(images: string[])
        {
            super();
            this._textureType = TextureType.TEXTURE_CUBE_MAP;

            this._pixels = [];
            for (var i = 0; i < 6; i++)
            {
                this._pixels[i] = new Image();
                this._pixels[i].crossOrigin = "Anonymous";
                this._pixels[i].addEventListener("load", this.invalidate.bind(this));
                this._pixels[i].src = images[i];
            }
        }

        /**
         * 判断数据是否满足渲染需求
         */
        public checkRenderData()
        {
            if (!this._pixels)
                return false;

            for (var i = 0; i < this._pixels.length; i++)
            {
                var element = this._pixels[i];
                if (!element.width || !element.height)
                    return false;
            }

            return true;
        }
    }
}