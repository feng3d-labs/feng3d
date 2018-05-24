namespace feng3d
{
    /**
     * 纹理信息
     * @author feng 2016-12-20
     */
    export abstract class TextureInfo
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
        protected _pixels: (ImageData | HTMLImageElement) | (ImageData | HTMLImageElement)[];

        /**
         * 当贴图数据未加载好等情况时代替使用
         */
        noPixels: (ImageData | HTMLImageElement) | (ImageData | HTMLImageElement)[];

        /**
         * 当前使用的贴图数据
         */
        protected _activePixels: (ImageData | HTMLImageElement) | (ImageData | HTMLImageElement)[];

        /**
         * 纹理缓冲
         */
        protected _textureMap = new Map<GL, WebGLTexture>();
        /**
         * 是否失效
         */
        private _invalid = true;

        /**
         * 是否为2的幂贴图
         */
        get isPowerOfTwo()
        {
            var isPowerOfTwo = true;
            var pixels = this._activePixels;
            if (pixels instanceof HTMLImageElement)
                isPowerOfTwo = FMath.isPowerOfTwo(pixels.width) && FMath.isPowerOfTwo(pixels.height);
            return isPowerOfTwo;
        }

        constructor(raw?: gPartial<TextureInfo>)
        {
            serialization.setValue(this, raw);
        }

        /**
         * 判断数据是否满足渲染需求
         */
        checkRenderData()
        {
            debuger && assert(false);

            return false;
        }

        /**
         * 使纹理失效
         */
        protected invalidate()
        {
            this._invalid = true;
        }

        /**
         * 激活纹理
         * @param gl 
         */
        active(gl: GL)
        {
            var currentPixels = this.checkRenderData() ? this._pixels : this.noPixels;
            if (this._invalid || this._activePixels != currentPixels)
            {
                this.clear();
                this._invalid = false;
            }

            this._activePixels = currentPixels;

            var texture = this.getTexture(gl);
            var textureType = gl[this._textureType];
            var minFilter = gl[this.minFilter];
            var magFilter = gl[this.magFilter];
            var wrapS = gl[this.wrapS];
            var wrapT = gl[this.wrapT];

            if (!this.isPowerOfTwo)
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
                if (gl.extensions.eXTTextureFilterAnisotropic)
                {
                    gl.extensions.eXTTextureFilterAnisotropic.texParameterf(textureType, this.anisotropy);
                } else
                {
                    debuger && alert("浏览器不支持各向异性过滤（anisotropy）特性！");
                }
            }
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
                //设置图片y轴方向
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.flipY ? 1 : 0);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premulAlpha ? 1 : 0);
                //绑定纹理
                gl.bindTexture(textureType, texture);
                //设置纹理图片
                this.initTexture(gl);
                if (this.generateMipmap && this.isPowerOfTwo)
                {
                    gl.generateMipmap(textureType);
                }
                this._textureMap.set(gl, texture);
            }
            return texture;
        }

        /**
         * 初始化纹理
         */
        private initTexture(gl: GL)
        {
            var format = gl[this.format];
            var type = gl[this.type];

            switch (this._textureType)
            {
                case TextureType.TEXTURE_CUBE_MAP:
                    var pixels: HTMLImageElement[] = <any>this._activePixels;
                    var faces = [
                        gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
                    ];
                    for (var i = 0; i < faces.length; i++)
                    {
                        gl.texImage2D(faces[i], 0, format, format, type, this._activePixels[i]);
                    }
                    break;
                case TextureType.TEXTURE_2D:
                    var _pixel: HTMLImageElement | ImageData = <any>this._activePixels;
                    var textureType = gl[this._textureType];
                    gl.texImage2D(textureType, 0, format, format, type, _pixel);
                    break;
                default:
                    break;
            }
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