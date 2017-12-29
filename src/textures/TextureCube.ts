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
        get positive_x_url()
        {
            return this._positive_x_url;
        }
        set positive_x_url(value)
        {
            if (this._positive_x_url == value)
                return;
            this._positive_x_url = value;
            this._pixels[0].src = value;
        }
        private _positive_x_url: string;

        @serialize()
        @oav()
        get positive_y_url()
        {
            return this._positive_y_url;
        }
        set positive_y_url(value)
        {
            if (this._positive_y_url == value)
                return;
            this._positive_y_url = value;
            this._pixels[1].src = value;
        }
        private _positive_y_url: string;

        @serialize()
        @oav()
        get positive_z_url()
        {
            return this._positive_z_url;
        }
        set positive_z_url(value)
        {
            if (this._positive_z_url == value)
                return;
            this._positive_z_url = value;
            this._pixels[2].src = value;
        }
        private _positive_z_url: string;

        @serialize()
        @oav()
        get negative_x_url()
        {
            return this._negative_x_url;
        }
        set negative_x_url(value)
        {
            if (this._negative_x_url == value)
                return;
            this._negative_x_url = value;
            this._pixels[3].src = value;
        }
        private _negative_x_url: string;

        @serialize()
        @oav()
        get negative_y_url()
        {
            return this._negative_y_url;
        }
        set negative_y_url(value)
        {
            if (this._negative_y_url == value)
                return;
            this._negative_y_url = value;
            this._pixels[4].src = value;
        }
        private _negative_y_url: string;

        @serialize()
        @oav()
        get negative_z_url()
        {
            return this._negative_z_url;
        }
        set negative_z_url(value)
        {
            if (this._negative_z_url == value)
                return;
            this._negative_z_url = value;
            this._pixels[5].src = value;
        }
        private _negative_z_url: string;
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
            }
            if (images)
            {
                this.positive_x_url = images[0];
                this.positive_y_url = images[1];
                this.positive_z_url = images[2];
                this.negative_x_url = images[3];
                this.negative_y_url = images[4];
                this.negative_z_url = images[5];
            }
        }

        /**
         * 判断数据是否满足渲染需求
         */
        checkRenderData()
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