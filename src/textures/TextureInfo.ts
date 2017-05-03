module feng3d
{
    /**
     * 纹理信息
     * @author feng 2016-12-20
     */
    export abstract class TextureInfo extends EventDispatcher
    {
        /**
         * 纹理类型
         */
        public get textureType() { return this._textureType; }
        public set textureType(value) { this._textureType = value; this.invalidate(); }
        protected _textureType: number;

        /**
         * 图片数据
         */
        public get pixels() { return this._pixels; }
        public set pixels(value) { this._pixels = value; this.invalidate(); }
        protected _pixels: ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageData[] | HTMLVideoElement[] | HTMLImageElement[] | HTMLCanvasElement[];

        /**
         * 格式
         */
        public get format() { return this._format; }
        public set format(value) { this._format = value; this.invalidate(); }
        protected _format: number = GL.RGB;

        /**
         * 数据类型
         */
        public get type() { return this._type; }
        public set type(value) { this._type = value; this.invalidate(); }
        public _type: number = GL.UNSIGNED_BYTE;

        /**
         * 是否生成mipmap
         */
        public get generateMipmap() { return this._generateMipmap; }
        public set generateMipmap(value) { this._generateMipmap = value; this.invalidate(); }
        private _generateMipmap: boolean = false;

        /**
         * 对图像进行Y轴反转。默认值为false
         */
        public get flipY() { return this._flipY; }
        public set flipY(value) { this._flipY = value; this.invalidate(); }
        private _flipY = false;

        /**
         * 将图像RGB颜色值得每一个分量乘以A。默认为false
         */
        public get premulAlpha() { return this._premulAlpha; }
        public set premulAlpha(value) { this._premulAlpha = value; this.invalidate(); }
        private _premulAlpha = false;

        public minFilter = GL.LINEAR;

        public magFilter = GL.LINEAR;
        /**
         * 表示x轴的纹理的回环方式，就是当纹理的宽度小于需要贴图的平面的宽度的时候，平面剩下的部分应该p以何种方式贴图的问题。
         */
        public wrapS = GL.CLAMP_TO_EDGE;
        /**
         * 表示y轴的纹理回环方式。 magFilter和minFilter表示过滤的方式，这是OpenGL的基本概念，我将在下面讲一下，目前你不用担心它的使用。当您不设置的时候，它会取默认值，所以，我们这里暂时不理睬他。
         */
        public wrapT = GL.CLAMP_TO_EDGE;
        /**
         * 各向异性过滤。使用各向异性过滤能够使纹理的效果更好，但是会消耗更多的内存、CPU、GPU时间。默认为0。
         */
        public anisotropy = 0;

        /**
         * 纹理缓冲
         */
        protected _textureMap = new Map<GL, WebGLTexture>();
        /**
         * 是否失效
         */
        private _invalid = true;



        /**
         * 构建纹理
         */
        constructor()
        {
            super();
            Watcher.watch(this, ["textureType"], this.invalidate, this);
            Watcher.watch(this, ["internalformat"], this.invalidate, this);
            Watcher.watch(this, ["format"], this.invalidate, this);
            Watcher.watch(this, ["type"], this.invalidate, this);
            Watcher.watch(this, ["generateMipmap"], this.invalidate, this);
            Watcher.watch(this, ["flipY"], this.invalidate, this);
            Watcher.watch(this, ["premulAlpha"], this.invalidate, this);
            // Watcher.watch(this, ["minFilter"], this.invalidate, this);
            // Watcher.watch(this, ["magFilter"], this.invalidate, this);
            // Watcher.watch(this, ["wrapS"], this.invalidate, this);
            // Watcher.watch(this, ["wrapT"], this.invalidate, this);
        }

        /**
         * 判断数据是否满足渲染需求
         */
        public checkRenderData()
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
        public active(gl: GL)
        {
            if (!this.checkRenderData())
                return;
            if (this._invalid)
            {
                this.clear();
                this._invalid = false;
            }

            var texture = this.getTexture(gl);
            //绑定纹理
            gl.bindTexture(this._textureType, texture);
            //设置纹理参数
            gl.texParameteri(this._textureType, GL.TEXTURE_MIN_FILTER, this.minFilter);
            gl.texParameteri(this._textureType, GL.TEXTURE_MAG_FILTER, this.magFilter);
            gl.texParameteri(this._textureType, GL.TEXTURE_WRAP_S, this.wrapS);
            gl.texParameteri(this._textureType, GL.TEXTURE_WRAP_T, this.wrapT);
            //
            var anisotropicExt = gl.ext.getAnisotropicExt();
            if (anisotropicExt)
            {
                if (this.anisotropy)
                {
                    var max = anisotropicExt.getMaxAnisotropy();
                    gl.texParameterf(gl.TEXTURE_2D, anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(this.anisotropy, max));
                }
            } else
            {
                debuger && alert("浏览器不支持各向异性过滤（anisotropy）特性！");
            }
        }

        /**
         * 获取顶点属性缓冲
         * @param data  数据 
         */
        public getTexture(gl: GL)
        {
            var texture = this._textureMap.get(gl);
            if (!texture)
            {
                texture = gl.createTexture();   // Create a texture object
                //设置图片y轴方向
                gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, this.flipY ? 1 : 0);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premulAlpha ? 1 : 0);
                //绑定纹理
                gl.bindTexture(this._textureType, texture);
                if (this._textureType == GL.TEXTURE_2D)
                {
                    //设置纹理图片
                    this.initTexture2D(gl);
                } else if (this._textureType == GL.TEXTURE_CUBE_MAP)
                {
                    this.initTextureCube(gl);
                }
                if (this._generateMipmap)
                {
                    gl.generateMipmap(this._textureType);
                }
                this._textureMap.push(gl, texture);
            }
            return texture;
        }

        /**
         * 初始化纹理
         */
        private initTexture2D(gl: GL)
        {
            gl.texImage2D(this._textureType, 0, this._format, this._format, this._type, <HTMLImageElement>this._pixels);
        }

        /**
         * 初始化纹理
         */
        private initTextureCube(gl: GL)
        {
            var faces = [
                GL.TEXTURE_CUBE_MAP_POSITIVE_X, GL.TEXTURE_CUBE_MAP_POSITIVE_Y, GL.TEXTURE_CUBE_MAP_POSITIVE_Z,
                GL.TEXTURE_CUBE_MAP_NEGATIVE_X, GL.TEXTURE_CUBE_MAP_NEGATIVE_Y, GL.TEXTURE_CUBE_MAP_NEGATIVE_Z
            ];
            for (var i = 0; i < faces.length; i++)
            {
                gl.texImage2D(faces[i], 0, this._format, this._format, this._type, this._pixels[i])
            }
        }

        /**
         * 清理纹理
         */
        private clear()
        {
            var gls = this._textureMap.getKeys();
            for (var i = 0; i < gls.length; i++)
            {
                gls[i].deleteTexture(this._textureMap.get(gls[i]))
            }
            this._textureMap.clear();
        }
    }
}