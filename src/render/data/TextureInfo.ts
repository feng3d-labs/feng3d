namespace feng3d
{
    /**
     * 纹理信息
     */
    export abstract class TextureInfo extends Feng3dAssets
    {
        /**
         * 纹理类型
         */
        protected _textureType: TextureType;

        /**
         * 格式
         */
        @serialize
        @watch("invalidate")
        @oav({ component: "OAVEnum", componentParam: { enumClass: TextureFormat } })
        format = TextureFormat.RGB;

        /**
         * 数据类型
         */
        @serialize
        @watch("invalidate")
        @oav({ component: "OAVEnum", componentParam: { enumClass: TextureDataType } })
        type = TextureDataType.UNSIGNED_BYTE;

        /**
         * 是否生成mipmap
         */
        @serialize
        @watch("invalidate")
        @oav()
        generateMipmap = false;

        /**
         * 对图像进行Y轴反转。默认值为false
         */
        @serialize
        @watch("invalidate")
        @oav()
        flipY = false;

        /**
         * 将图像RGB颜色值得每一个分量乘以A。默认为false
         */
        @serialize
        @watch("invalidate")
        @oav()
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
        wrapS = TextureWrap.REPEAT;
        /**
         * 表示y轴的纹理回环方式。 magFilter和minFilter表示过滤的方式，这是OpenGL的基本概念，我将在下面讲一下，目前你不用担心它的使用。当您不设置的时候，它会取默认值，所以，我们这里暂时不理睬他。
         */
        @serialize
        @oav({ component: "OAVEnum", componentParam: { enumClass: TextureWrap } })
        wrapT = TextureWrap.REPEAT;
        /**
         * 各向异性过滤。使用各向异性过滤能够使纹理的效果更好，但是会消耗更多的内存、CPU、GPU时间。默认为0。
         */
        @serialize
        @oav()
        anisotropy = 0;

        /**
         * 需要使用的贴图数据
         */
        protected _pixels: (ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap) | (ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap)[];

        /**
         * 当贴图数据未加载好等情况时代替使用
         */
        noPixels: string | string[];

        /**
         * 当前使用的贴图数据
         */
        protected _activePixels: (ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap) | (ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap)[];

        /**
         * 是否为渲染目标纹理
         */
        protected _isRenderTarget = false;

        @watch("invalidate")
        protected OFFSCREEN_WIDTH = 1024;

        @watch("invalidate")
        protected OFFSCREEN_HEIGHT = 1024;

        /**
         * 纹理缓冲
         */
        protected _textureMap = new Map<GL, WebGLTexture>();
        /**
         * 是否失效
         */
        private _invalid = true;

        private _isPowerOfTwo = false;

        /**
         * 是否为2的幂贴图
         */
        private isPowerOfTwo(pixels: (ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap) | (ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap)[])
        {
            if (this._isRenderTarget)
            {
                if (this.OFFSCREEN_WIDTH == 0 || !FMath.isPowerOfTwo(this.OFFSCREEN_WIDTH))
                    return false;
                if (this.OFFSCREEN_HEIGHT == 0 || !FMath.isPowerOfTwo(this.OFFSCREEN_HEIGHT))
                    return false;
                return true;
            }
            if (!pixels) return false;
            if (!(pixels instanceof Array))
                pixels = [pixels];
            for (let i = 0; i < pixels.length; i++)
            {
                const element = pixels[i];
                if (element.width == 0 || !FMath.isPowerOfTwo(element.width))
                    return false;
                if (element.height == 0 || !FMath.isPowerOfTwo(element.height))
                    return false;
            }
            return true;
        }

        /**
         * 纹理尺寸
         */
        getSize()
        {
            if (this._isRenderTarget)
            {
                return new Vector2(this.OFFSCREEN_WIDTH, this.OFFSCREEN_HEIGHT);
            }
            var pixels = this._activePixels;
            if (!pixels) new Vector2(1, 1);
            if (!(pixels instanceof Array))
                pixels = [pixels];
            if (pixels.length == 0)
                return new Vector2(1, 1);
            var pixel = pixels[0];
            return new Vector2(pixel.width, pixel.height);
        }

        /**
         * 判断数据是否满足渲染需求
         */
        private checkRenderData(pixels: (ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap) | (ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap)[])
        {
            if (!pixels) return false;
            if (!(pixels instanceof Array))
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
        protected invalidate()
        {
            this._invalid = true;
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
                if (this.noPixels instanceof Array)
                {
                    this._activePixels = this.noPixels.map(v => imageDatas[v]);
                } else
                {
                    this._activePixels = imageDatas[this.noPixels];
                }
            }
            if (old != this._activePixels) this._dataURL = null;
        }

        /**
         * 激活纹理
         * @param gl 
         */
        active(gl: GL)
        {
            if (this._invalid)
            {
                this.clear();
                this._invalid = false;
                this.updateActivePixels();

                this._isPowerOfTwo = this.isPowerOfTwo(this._activePixels);
            }

            var texture = this.getTexture(gl);
            var textureType = gl[this._textureType];
            var minFilter = gl[this.minFilter];
            var magFilter = gl[this.magFilter];
            var wrapS = gl[this.wrapS];
            var wrapT = gl[this.wrapT];

            if (!this._isPowerOfTwo)
            {
                wrapS = gl.CLAMP_TO_EDGE;
                wrapT = gl.CLAMP_TO_EDGE;
            }

            //绑定纹理
            gl.bindTexture(textureType, texture);
            //设置纹理参数
            gl.texParameteri(textureType, gl.TEXTURE_MIN_FILTER, minFilter);
            gl.texParameteri(textureType, gl.TEXTURE_MAG_FILTER, magFilter);
            gl.texParameteri(textureType, gl.TEXTURE_WRAP_S, wrapS);
            gl.texParameteri(textureType, gl.TEXTURE_WRAP_T, wrapT);

            //
            if (this.anisotropy)
            {
                var eXTTextureFilterAnisotropic = gl.extensions.eXTTextureFilterAnisotropic;
                if (eXTTextureFilterAnisotropic)
                {
                    if (this.anisotropy > gl.maxAnisotropy)
                    {
                        this.anisotropy = gl.maxAnisotropy;
                        warn(`${this.anisotropy} 超出 maxAnisotropy 的最大值 ${gl.maxAnisotropy} ！,使用最大值替换。`);
                    }
                    gl.texParameterf(textureType, eXTTextureFilterAnisotropic.TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropy);

                } else
                {
                    debuger && alert("浏览器不支持各向异性过滤（anisotropy）特性！");
                }
            }
            return texture;
        }

        /**
         * 获取顶点属性缓冲
         * @param data  数据 
         */
        getTexture(gl: GL)
        {
            var texture = this._textureMap.get(gl);
            if (!texture)
            {
                var newtexture = gl.createTexture();   // Create a texture object
                if (!newtexture)
                {
                    error("createTexture 失败！");
                    throw "";
                }
                texture = newtexture;
                var textureType = gl[this._textureType];
                var format = gl[this.format];
                var type = gl[this.type];

                //设置图片y轴方向
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.flipY ? 1 : 0);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premulAlpha ? 1 : 0);
                //绑定纹理
                gl.bindTexture(textureType, texture);
                //设置纹理图片
                switch (textureType)
                {
                    case gl.TEXTURE_CUBE_MAP:
                        var pixels: (ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap)[] = <any>this._activePixels;
                        var faces = [
                            gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                            gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
                        ];
                        for (var i = 0; i < faces.length; i++)
                        {
                            if (this._isRenderTarget)
                            {
                                gl.texImage2D(faces[i], 0, format, this.OFFSCREEN_WIDTH, this.OFFSCREEN_HEIGHT, 0, format, type, null);
                            } else
                            {
                                gl.texImage2D(faces[i], 0, format, format, type, this._activePixels[i]);
                            }
                        }
                        break;
                    case gl.TEXTURE_2D:
                        var _pixel: ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap = <any>this._activePixels;
                        var textureType = gl[this._textureType];
                        if (this._isRenderTarget)
                        {
                            gl.texImage2D(textureType, 0, format, this.OFFSCREEN_WIDTH, this.OFFSCREEN_HEIGHT, 0, format, type, null);
                        } else
                        {
                            gl.texImage2D(textureType, 0, format, format, type, _pixel);
                        }
                        break;
                    default:
                        throw "";
                }
                if (this.generateMipmap && this._isPowerOfTwo)
                {
                    gl.generateMipmap(textureType);
                }
                this._textureMap.set(gl, texture);
            }
            return texture;
        }

        /**
         * 清理纹理
         */
        private clear()
        {
            this._textureMap.forEach((v, k) =>
            {
                k.deleteTexture(v);
            });
            this._textureMap.clear();
        }
    }
}