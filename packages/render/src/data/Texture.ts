namespace feng3d
{
    export interface Texture
    {
        /**
         * 纹理类型
         */
        textureType: TextureType;

        /**
         * 格式
         */
        format: TextureFormat;

        /**
         * 数据类型
         */
        type: TextureDataType;

        /**
         * 是否生成mipmap
         */
        generateMipmap: boolean;

        /**
         * 对图像进行Y轴反转。默认值为false
         */
        flipY: boolean;

        /**
         * 将图像RGB颜色值得每一个分量乘以A。默认为false
         */
        premulAlpha: boolean;

        minFilter: TextureMinFilter;

        magFilter: TextureMagFilter;

        /**
         * 表示x轴的纹理的回环方式，就是当纹理的宽度小于需要贴图的平面的宽度的时候，平面剩下的部分应该p以何种方式贴图的问题。
         */
        wrapS: TextureWrap;

        /**
         * 表示y轴的纹理回环方式。 magFilter和minFilter表示过滤的方式，这是OpenGL的基本概念，我将在下面讲一下，目前你不用担心它的使用。当您不设置的时候，它会取默认值，所以，我们这里暂时不理睬他。
         */
        wrapT: TextureWrap;

        /**
         * 各向异性过滤。使用各向异性过滤能够使纹理的效果更好，但是会消耗更多的内存、CPU、GPU时间。默认为0。
         */
        anisotropy: number;

        /**
         * 当前使用的贴图数据
         */
        activePixels: TexImageSource | TexImageSource[];

        /**
         * 是否为渲染目标纹理
         */
        isRenderTarget: boolean;

        OFFSCREEN_WIDTH: number;

        OFFSCREEN_HEIGHT: number;

        /**
         * 是否失效，值为true时重新创建 WebGLTexture
         */
        invalid: boolean;
    }

    export class Texture
    {
        static active(gl: GL, data: Texture)
        {
            var texture = this.getTexture(gl, data);

            var textureType = gl[data.textureType];

            //绑定纹理
            gl.bindTexture(textureType, texture);
            //设置纹理参数
            gl.texParameteri(textureType, gl.TEXTURE_MIN_FILTER, gl[data.minFilter]);
            gl.texParameteri(textureType, gl.TEXTURE_MAG_FILTER, gl[data.magFilter]);
            gl.texParameteri(textureType, gl.TEXTURE_WRAP_S, gl[data.wrapS]);
            gl.texParameteri(textureType, gl.TEXTURE_WRAP_T, gl[data.wrapT]);

            //
            gl.texParameterfAnisotropy(textureType, data.anisotropy);
            return texture;
        }

        /**
         * 获取顶点属性缓冲
         * @param data  数据 
         */
        static getTexture(gl: GL, data: Texture)
        {
            if (data.invalid)
            {
                this.clear(data);
                data.invalid = false;
            }
            var texture = gl.cache.textures.get(data);
            if (!texture)
            {
                texture = gl.createTexture();   // Create a texture object
                if (!texture)
                {
                    console.error("createTexture 失败！");
                    throw "";
                }
                gl.cache.textures.set(data, texture);

                //
                var textureType = gl[data.textureType];
                var format = gl[data.format];
                var type = gl[data.type];

                //设置图片y轴方向
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, data.flipY ? 1 : 0);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, data.premulAlpha ? 1 : 0);
                //绑定纹理
                gl.bindTexture(textureType, texture);
                //设置纹理图片
                switch (textureType)
                {
                    case gl.TEXTURE_CUBE_MAP:
                        var pixels: TexImageSource[] = <any>data.activePixels;
                        var faces = [
                            gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                            gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
                        ];
                        for (var i = 0; i < faces.length; i++)
                        {
                            if (data.isRenderTarget)
                            {
                                gl.texImage2D(faces[i], 0, format, data.OFFSCREEN_WIDTH, data.OFFSCREEN_HEIGHT, 0, format, type, null);
                            } else
                            {
                                gl.texImage2D(faces[i], 0, format, format, type, pixels[i]);
                            }
                        }
                        break;
                    case gl.TEXTURE_2D:
                        var _pixel: TexImageSource = <any>data.activePixels;
                        if (data.isRenderTarget)
                        {
                            gl.texImage2D(textureType, 0, format, data.OFFSCREEN_WIDTH, data.OFFSCREEN_HEIGHT, 0, format, type, null);
                        } else
                        {
                            gl.texImage2D(textureType, 0, format, format, type, _pixel);
                        }
                        break;
                    default:
                        throw "";
                }
                if (data.generateMipmap)
                {
                    gl.generateMipmap(textureType);
                }
            }
            return texture;
        }

        /**
         * 清除纹理
         * 
         * @param data 
         */
        static clear(data: Texture)
        {
            GL.glList.forEach(gl =>
            {
                var tex = gl.cache.textures.get(data);
                if (tex)
                {
                    gl.deleteTexture(tex);
                    gl.cache.textures.delete(data);
                }
            });
        }
    }

}