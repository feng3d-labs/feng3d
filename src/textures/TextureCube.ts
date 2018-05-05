namespace feng3d
{

    /**
     * 立方体纹理
     * @author feng 2016-12-28
     */
    export class TextureCube extends TextureInfo
    {
        protected _pixels: HTMLImageElement[];

        @serialize()
        @oav()
        @watch("urlChanged")
        positive_x_url: string;

        @serialize()
        @oav()
        @watch("urlChanged")
        positive_y_url: string;

        @serialize()
        @oav()
        @watch("urlChanged")
        positive_z_url: string;

        @serialize()
        @oav()
        @watch("urlChanged")
        negative_x_url: string;

        @serialize()
        @oav()
        @watch("urlChanged")
        negative_y_url: string;

        @serialize()
        @oav()
        @watch("urlChanged")
        negative_z_url: string;

        constructor(images?: string[])
        {
            super();
            this._textureType = TextureType.TEXTURE_CUBE_MAP;

            this.noPixels = [imageDatas.white, imageDatas.white, imageDatas.white, imageDatas.white, imageDatas.white, imageDatas.white];
            this._pixels = [];
            if (images)
            {
                this.positive_x_url = images[0];
                this.positive_y_url = images[1];
                this.positive_z_url = images[2];
                this.negative_x_url = images[3];
                this.negative_y_url = images[4];
                this.negative_z_url = images[5];
                this.urlChanged();
            }
        }

        /**
         * 判断数据是否满足渲染需求
         */
        checkRenderData()
        {
            if (!this._pixels)
                return false;

            for (var i = 0; i < 6; i++)
            {
                var element = this._pixels[i];
                if (!element || !element.width || !element.height)
                    return false;
            }

            return true;
        }

        private urlChanged()
        {
            var __this = this;

            loadImage(this.positive_x_url, 0);
            loadImage(this.positive_y_url, 1);
            loadImage(this.positive_z_url, 2);
            loadImage(this.negative_x_url, 3);
            loadImage(this.negative_y_url, 4);
            loadImage(this.negative_z_url, 5);

            function loadImage(url: string, index: number)
            {
                if (!url) return;
                assets.loadImage(url, (img) =>
                {
                    __this._pixels[index] = img;
                    __this.invalidate();
                });
            }
        }
    }
}