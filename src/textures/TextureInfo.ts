module feng3d
{
    /**
     * 纹理信息
     * @author feng 2016-12-20
     */
    export class TextureInfo
    {
        /**
         * 纹理类型
         */
        public textureType: number;
        /**
         * 内部格式
         */
        public internalformat: number = GL.RGB;
        /**
         * 格式
         */
        public format: number = GL.RGB;
        /**
         * 数据类型
         */
        public type: number = GL.UNSIGNED_BYTE;

        /**
         * 是否生成mipmap
         */
        public generateMipmap: boolean = true;

        /**
         * 图片y轴向
         */
        public flipY = 1;

        public minFilter = GL.LINEAR;

        public magFilter = GL.NEAREST;

        public wrapS = GL.CLAMP_TO_EDGE;
        public wrapT = GL.CLAMP_TO_EDGE;

        /**
         * 图片数据
         */
        // ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
        public pixels: HTMLImageElement | HTMLImageElement[];

        /**
         * 纹理缓冲
         */
        private _textureMap = new Map<GL, WebGLTexture>();
        /**
         * 是否失效
         */
        private _invalid = true;

        /**
         * 构建纹理
         */
        constructor()
        {
            Watcher.watch(this, ["textureType"], this.invalidate, this);
            Watcher.watch(this, ["internalformat"], this.invalidate, this);
            Watcher.watch(this, ["format"], this.invalidate, this);
            Watcher.watch(this, ["type"], this.invalidate, this);
            Watcher.watch(this, ["generateMipmap"], this.invalidate, this);
            Watcher.watch(this, ["flipY"], this.invalidate, this);
            // Watcher.watch(this, ["minFilter"], this.invalidate, this);
            // Watcher.watch(this, ["magFilter"], this.invalidate, this);
            // Watcher.watch(this, ["wrapS"], this.invalidate, this);
            // Watcher.watch(this, ["wrapT"], this.invalidate, this);
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
            if (this._invalid)
            {
                this.clear();
                this._invalid = false;
            }

            var texture = this.getTexture(gl);
            //绑定纹理
            gl.bindTexture(this.textureType, texture);
            // //设置图片y轴方向
            // gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, this.flipY);
            // console.warn("flipY:" + this.flipY);
            //设置纹理参数
            gl.texParameteri(this.textureType, GL.TEXTURE_MIN_FILTER, this.minFilter);
            gl.texParameteri(this.textureType, GL.TEXTURE_MAG_FILTER, this.magFilter);
            gl.texParameteri(this.textureType, GL.TEXTURE_WRAP_S, this.wrapS);
            gl.texParameteri(this.textureType, GL.TEXTURE_WRAP_T, this.wrapT);
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
                //绑定纹理
                gl.bindTexture(this.textureType, texture);
                if (this.textureType == GL.TEXTURE_2D)
                {
                    //设置纹理图片
                    gl.texImage2D(this.textureType, 0, this.internalformat, this.format, this.type, <HTMLImageElement>this.pixels);
                } else if (this.textureType == GL.TEXTURE_CUBE_MAP)
                {
                    var faces = [
                        GL.TEXTURE_CUBE_MAP_POSITIVE_X, GL.TEXTURE_CUBE_MAP_POSITIVE_Y, GL.TEXTURE_CUBE_MAP_POSITIVE_Z,
                        GL.TEXTURE_CUBE_MAP_NEGATIVE_X, GL.TEXTURE_CUBE_MAP_NEGATIVE_Y, GL.TEXTURE_CUBE_MAP_NEGATIVE_Z
                    ];
                    for (var i = 0; i < faces.length; i++)
                    {
                        gl.texImage2D(faces[i], 0, this.internalformat, this.format, this.type, this.pixels[i])
                    }
                }
                if (this.generateMipmap)
                {
                    gl.generateMipmap(this.textureType);
                }
                //设置图片y轴方向
                gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, this.flipY);
                // console.warn("flipY:" + this.flipY);
                this._textureMap.push(gl, texture);
            }
            return texture;
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