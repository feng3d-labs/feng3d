namespace feng3d
{
    /**
     * 纹理信息
     */
    export abstract class TextureInfo<T = any> extends Feng3dObject<T> implements Texture
    {
        /**
         * 纹理类型
         */
        textureType: TextureType;

        /**
         * 格式
         */
        @serialize
        @oav({ component: "OAVEnum", componentParam: { enumClass: TextureFormat } })
        @watch("invalidate")
        format = TextureFormat.RGBA;

        /**
         * 数据类型
         */
        @serialize
        @oav({ component: "OAVEnum", componentParam: { enumClass: TextureDataType } })
        @watch("invalidate")
        type = TextureDataType.UNSIGNED_BYTE;

        /**
         * 是否生成mipmap
         */
        @serialize
        @oav()
        @watch("invalidate")
        generateMipmap = false;

        /**
         * 对图像进行Y轴反转。默认值为false
         */
        @serialize
        @oav()
        @watch("invalidate")
        flipY = false;

        /**
         * 将图像RGB颜色值得每一个分量乘以A。默认为false
         */
        @serialize
        @oav()
        @watch("invalidate")
        premulAlpha = false;

        @serialize
        @oav({ component: "OAVEnum", componentParam: { enumClass: TextureMinFilter } })
        minFilter = TextureMinFilter.LINEAR;

        @serialize
        @oav({ component: "OAVEnum", componentParam: { enumClass: TextureMagFilter } })
        magFilter = TextureMagFilter.LINEAR;
        /**
         * 表示x轴的纹理的回环方式，就是当纹理的宽度小于需要贴图的平面的宽度的时候，平面剩下的部分应该p以何种方式贴图的问题。
         */
        @serialize
        @oav({ component: "OAVEnum", componentParam: { enumClass: TextureWrap } })
        get wrapS()
        {
            if (!this.isPowerOfTwo)
                return TextureWrap.CLAMP_TO_EDGE;
            return this._wrapS;
        }
        set wrapS(v)
        {
            this._wrapS = v;
        }
        private _wrapS = TextureWrap.REPEAT;

        /**
         * 表示y轴的纹理回环方式。 magFilter和minFilter表示过滤的方式，这是OpenGL的基本概念，我将在下面讲一下，目前你不用担心它的使用。当您不设置的时候，它会取默认值，所以，我们这里暂时不理睬他。
         */
        @serialize
        @oav({ component: "OAVEnum", componentParam: { enumClass: TextureWrap } })
        get wrapT()
        {
            if (!this.isPowerOfTwo)
                return TextureWrap.CLAMP_TO_EDGE;
            return this._wrapT;
        }
        set wrapT(v)
        {
            this._wrapT = v;
        }
        private _wrapT = TextureWrap.REPEAT;

        /**
         * 各向异性过滤。使用各向异性过滤能够使纹理的效果更好，但是会消耗更多的内存、CPU、GPU时间。默认为0。
         */
        @serialize
        @oav()
        anisotropy = 0;

        invalid = true;

        /**
         * 需要使用的贴图数据
         */
        protected _pixels: TexImageSource | TexImageSource[];

        /**
         * 当贴图数据未加载好等情况时代替使用
         */
        noPixels: string | string[];

        /**
         * 当前使用的贴图数据
         */
        protected _activePixels: TexImageSource | TexImageSource[];

        /**
         * 是否为渲染目标纹理
         */
        isRenderTarget = false;

        @watch("invalidate")
        OFFSCREEN_WIDTH = 1024;

        @watch("invalidate")
        OFFSCREEN_HEIGHT = 1024;

        /**
         * 是否为2的幂贴图
         */
        get isPowerOfTwo()
        {
            if (this.isRenderTarget)
            {
                if (this.OFFSCREEN_WIDTH == 0 || !Math.isPowerOfTwo(this.OFFSCREEN_WIDTH))
                    return false;
                if (this.OFFSCREEN_HEIGHT == 0 || !Math.isPowerOfTwo(this.OFFSCREEN_HEIGHT))
                    return false;
                return true;
            }
            var pixels = this.activePixels;
            if (!pixels) return false;
            if (!Array.isArray(pixels))
                pixels = [pixels];
            for (let i = 0; i < pixels.length; i++)
            {
                const element = pixels[i];
                if (element.width == 0 || !Math.isPowerOfTwo(element.width))
                    return false;
                if (element.height == 0 || !Math.isPowerOfTwo(element.height))
                    return false;
            }
            return true;
        }

        /**
         * 纹理尺寸
         */
        getSize()
        {
            if (this.isRenderTarget)
            {
                return new Vector2(this.OFFSCREEN_WIDTH, this.OFFSCREEN_HEIGHT);
            }
            var pixels = this.activePixels;
            if (!pixels) new Vector2(1, 1);
            if (!Array.isArray(pixels))
                pixels = [pixels];
            if (pixels.length == 0)
                return new Vector2(1, 1);
            var pixel = pixels[0];
            return new Vector2(pixel.width, pixel.height);
        }

        /**
         * 判断数据是否满足渲染需求
         */
        private checkRenderData(pixels: TexImageSource | TexImageSource[])
        {
            if (!pixels) return false;
            if (!Array.isArray(pixels))
                pixels = [pixels];

            if (pixels.length == 0) return false;
            for (let i = 0; i < pixels.length; i++)
            {
                const element = pixels[i];
                if (!element) return false;
                if (element.width == 0)
                    return false;
                if (element.height == 0)
                    return false;
            }
            return true;
        }

        /**
         * 使纹理失效
         */
        invalidate()
        {
            this.invalid = true;
        }

        get activePixels()
        {
            this.updateActivePixels();
            return this._activePixels;
        }

        /**
         * 
         */
        get dataURL()
        {
            this.updateActivePixels();
            if (!this._dataURL)
            {
                if (this._activePixels instanceof ImageData)
                    this._dataURL = dataTransform.imageDataToDataURL(this._activePixels)
                else if (this._activePixels instanceof HTMLImageElement)
                    this._dataURL = dataTransform.imageToDataURL(this._activePixels);
                else if (this._activePixels instanceof HTMLCanvasElement)
                    this._dataURL = dataTransform.canvasToDataURL(this._activePixels);
            }
            return this._dataURL;
        }
        private _dataURL: string;

        private updateActivePixels()
        {
            var old = this._activePixels;
            if (this.checkRenderData(this._pixels))
            {
                this._activePixels = this._pixels;
            } else
            {
                if (Array.isArray(this.noPixels))
                {
                    this._activePixels = this.noPixels.map(v => imageDatas[v]);
                } else
                {
                    this._activePixels = imageDatas[this.noPixels];
                }
            }
            if (old != this._activePixels) this._dataURL = null;
        }
    }
}