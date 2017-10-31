module feng3d
{
    export class ImageDataTexture extends TextureInfo
    {
        get pixels()
        {
            return this._pixels;
        }

        set pixels(value)
        {
            this._pixels = value;
        }

        private _pixels: ImageData;

        /**
         * 初始化纹理
         */
        protected initTexture(gl: GL)
        {
            gl.texImage2D(this._textureType, 0, this._format, this._format, this._type, this._pixels);
        }

        /**
         * 判断数据是否满足渲染需求
         */
        checkRenderData()
        {
            if (!this._pixels)
                return false;

            if (!this._pixels.width || !this._pixels.height)
                return false;

            return true;
        }
    }
}