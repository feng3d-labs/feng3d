var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var feng3d;
(function (feng3d) {
    /**
     * 纹理信息
     * @author feng 2016-12-20
     */
    var TextureInfo = (function () {
        /**
         * 构建纹理
         */
        function TextureInfo() {
            this._width = 100;
            this._height = 100;
            this._size = new feng3d.Point(100, 100);
            this._format = feng3d.GL.RGB;
            this._type = feng3d.GL.UNSIGNED_BYTE;
            this._generateMipmap = false;
            this._flipY = false;
            this._premulAlpha = false;
            this.minFilter = feng3d.GL.LINEAR;
            this.magFilter = feng3d.GL.LINEAR;
            /**
             * 表示x轴的纹理的回环方式，就是当纹理的宽度小于需要贴图的平面的宽度的时候，平面剩下的部分应该p以何种方式贴图的问题。
             */
            this.wrapS = feng3d.GL.REPEAT;
            /**
             * 表示y轴的纹理回环方式。 magFilter和minFilter表示过滤的方式，这是OpenGL的基本概念，我将在下面讲一下，目前你不用担心它的使用。当您不设置的时候，它会取默认值，所以，我们这里暂时不理睬他。
             */
            this.wrapT = feng3d.GL.REPEAT;
            /**
             * 各向异性过滤。使用各向异性过滤能够使纹理的效果更好，但是会消耗更多的内存、CPU、GPU时间。默认为0。
             */
            this.anisotropy = 0;
            /**
             * 纹理缓冲
             */
            this._textureMap = new feng3d.Map();
            /**
             * 是否失效
             */
            this._invalid = true;
        }
        Object.defineProperty(TextureInfo.prototype, "textureType", {
            /**
             * 纹理类型
             */
            get: function () { return this._textureType; },
            set: function (value) { this._textureType = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "pixels", {
            /**
             * 图片数据
             */
            get: function () { return this._pixels; },
            set: function (value) { this._pixels = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "width", {
            /**
             * 纹理宽度
             */
            get: function () {
                if (this._pixels && this._pixels.hasOwnProperty("width"))
                    return this._pixels["width"];
                return this._width;
            },
            set: function (value) { this._width = value; },
            enumerable: true,
            configurable: true
        });
        ;
        Object.defineProperty(TextureInfo.prototype, "height", {
            /**
             * 纹理高度
             */
            get: function () {
                if (this._pixels && this._pixels.hasOwnProperty("height"))
                    return this._pixels["height"];
                return this._height;
            },
            set: function (value) { this._height = value; },
            enumerable: true,
            configurable: true
        });
        ;
        Object.defineProperty(TextureInfo.prototype, "size", {
            /**
             * 纹理尺寸
             */
            get: function () { this._size.setTo(this.width, this.height); return this._size; },
            set: function (value) { this.width = value.x; this.height = value.y; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "format", {
            /**
             * 格式
             */
            get: function () { return this._format; },
            set: function (value) { this._format = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "type", {
            /**
             * 数据类型
             */
            get: function () { return this._type; },
            set: function (value) { this._type = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "generateMipmap", {
            /**
             * 是否生成mipmap
             */
            get: function () { return this._generateMipmap; },
            set: function (value) { this._generateMipmap = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "flipY", {
            /**
             * 对图像进行Y轴反转。默认值为false
             */
            get: function () { return this._flipY; },
            set: function (value) { this._flipY = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "premulAlpha", {
            /**
             * 将图像RGB颜色值得每一个分量乘以A。默认为false
             */
            get: function () { return this._premulAlpha; },
            set: function (value) { this._premulAlpha = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        /**
         * 判断数据是否满足渲染需求
         */
        TextureInfo.prototype.checkRenderData = function () {
            feng3d.debuger && console.assert(false);
            return false;
        };
        /**
         * 使纹理失效
         */
        TextureInfo.prototype.invalidate = function () {
            this._invalid = true;
        };
        /**
         * 激活纹理
         * @param gl
         */
        TextureInfo.prototype.active = function (gl) {
            if (!this.checkRenderData())
                return;
            if (this._invalid) {
                this.clear();
                this._invalid = false;
            }
            var texture = this.getTexture(gl);
            //绑定纹理
            gl.bindTexture(this._textureType, texture);
            //设置纹理参数
            gl.texParameteri(this._textureType, feng3d.GL.TEXTURE_MIN_FILTER, this.minFilter);
            gl.texParameteri(this._textureType, feng3d.GL.TEXTURE_MAG_FILTER, this.magFilter);
            gl.texParameteri(this._textureType, feng3d.GL.TEXTURE_WRAP_S, this.wrapS);
            gl.texParameteri(this._textureType, feng3d.GL.TEXTURE_WRAP_T, this.wrapT);
            //
            if (this.anisotropy) {
                if (gl.anisotropicExt) {
                    gl.texParameterf(gl.TEXTURE_2D, gl.anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(this.anisotropy, gl.maxAnisotropy));
                }
                else {
                    feng3d.debuger && alert("浏览器不支持各向异性过滤（anisotropy）特性！");
                }
            }
        };
        /**
         * 获取顶点属性缓冲
         * @param data  数据
         */
        TextureInfo.prototype.getTexture = function (gl) {
            var texture = this._textureMap.get(gl);
            if (!texture) {
                texture = gl.createTexture(); // Create a texture object
                texture.uuid = Math.generateUUID();
                //设置图片y轴方向
                gl.pixelStorei(feng3d.GL.UNPACK_FLIP_Y_WEBGL, this.flipY ? 1 : 0);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premulAlpha ? 1 : 0);
                //绑定纹理
                gl.bindTexture(this._textureType, texture);
                if (this._textureType == feng3d.GL.TEXTURE_2D) {
                    //设置纹理图片
                    this.initTexture2D(gl);
                }
                else if (this._textureType == feng3d.GL.TEXTURE_CUBE_MAP) {
                    this.initTextureCube(gl);
                }
                if (this._generateMipmap) {
                    gl.generateMipmap(this._textureType);
                }
                this._textureMap.push(gl, texture);
            }
            return texture;
        };
        /**
         * 初始化纹理
         */
        TextureInfo.prototype.initTexture2D = function (gl) {
            gl.texImage2D(this._textureType, 0, this._format, this._format, this._type, this._pixels);
        };
        /**
         * 初始化纹理
         */
        TextureInfo.prototype.initTextureCube = function (gl) {
            var faces = [
                feng3d.GL.TEXTURE_CUBE_MAP_POSITIVE_X, feng3d.GL.TEXTURE_CUBE_MAP_POSITIVE_Y, feng3d.GL.TEXTURE_CUBE_MAP_POSITIVE_Z,
                feng3d.GL.TEXTURE_CUBE_MAP_NEGATIVE_X, feng3d.GL.TEXTURE_CUBE_MAP_NEGATIVE_Y, feng3d.GL.TEXTURE_CUBE_MAP_NEGATIVE_Z
            ];
            for (var i = 0; i < faces.length; i++) {
                gl.texImage2D(faces[i], 0, this._format, this._format, this._type, this._pixels[i]);
            }
        };
        /**
         * 清理纹理
         */
        TextureInfo.prototype.clear = function () {
            var gls = this._textureMap.getKeys();
            for (var i = 0; i < gls.length; i++) {
                gls[i].deleteTexture(this._textureMap.get(gls[i]));
            }
            this._textureMap.clear();
        };
        return TextureInfo;
    }());
    __decorate([
        feng3d.serialize
    ], TextureInfo.prototype, "textureType", null);
    __decorate([
        feng3d.serialize
    ], TextureInfo.prototype, "width", null);
    __decorate([
        feng3d.serialize
    ], TextureInfo.prototype, "height", null);
    __decorate([
        feng3d.serialize
    ], TextureInfo.prototype, "size", null);
    __decorate([
        feng3d.serialize
    ], TextureInfo.prototype, "format", null);
    __decorate([
        feng3d.serialize
    ], TextureInfo.prototype, "type", null);
    __decorate([
        feng3d.serialize
    ], TextureInfo.prototype, "generateMipmap", null);
    __decorate([
        feng3d.serialize
    ], TextureInfo.prototype, "flipY", null);
    __decorate([
        feng3d.serialize
    ], TextureInfo.prototype, "premulAlpha", null);
    __decorate([
        feng3d.serialize
    ], TextureInfo.prototype, "minFilter", void 0);
    __decorate([
        feng3d.serialize
    ], TextureInfo.prototype, "magFilter", void 0);
    __decorate([
        feng3d.serialize
    ], TextureInfo.prototype, "wrapS", void 0);
    __decorate([
        feng3d.serialize
    ], TextureInfo.prototype, "wrapT", void 0);
    __decorate([
        feng3d.serialize
    ], TextureInfo.prototype, "anisotropy", void 0);
    feng3d.TextureInfo = TextureInfo;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=TextureInfo.js.map