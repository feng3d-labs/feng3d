namespace feng3d
{
    /**
     * @private
     */
    export var enums: {
        getBlendEquationValue: (gl: GL) => (blendEquation: BlendEquation) => number;
        getBlendFactorValue: (gl: GL) => (blendFactor: BlendFactor) => number;
        getRenderModeValue: (gl: GL) => (renderMode: RenderMode) => number;
        getTextureTypeValue: (gl: GL) => (textureType: TextureType) => number;
        getCullFaceValue: (gl: GL) => (cullFace: CullFace) => number;
        getFrontFaceValue: (gl: GL) => (frontFace: FrontFace) => number;
        getTextureFormatValue: (gl: GL) => (textureFormat: TextureFormat) => number;
        getTextureDataTypeValue: (gl: GL) => (textureDataType: TextureDataType) => number;
        getTextureMinFilterValue: (gl: GL) => (textureMinFilter: TextureMinFilter) => number;
        getTextureMagFilterValue: (gl: GL) => (textureMagFilter: TextureMagFilter) => number;
        getTextureWrapValue: (gl: GL) => (textureWrapS: TextureWrap) => number;
        getGLArrayTypeValue: (gl: GL) => (glArrayType: GLArrayType) => number;
        getdDepthFuncValue: (gl: GL) => (depthFunc: DepthFunc) => number;
    };

    /**
     * GL枚举
     */
    export class GLEnum
    {
        /**
         * 根据渲染模式枚举获取真实值
         * @param renderMode 渲染模式枚举
         */
        readonly getRenderModeValue: (renderMode: RenderMode) => number;

        /**
         * 根据纹理类型枚举获取真实值
         * @param textureType   纹理类型枚举
         */
        readonly getTextureTypeValue: (textureType: TextureType) => number

        /**
         * 根据混合方法枚举获取真实值
         * @param blendEquation    混合方法枚举
         */
        readonly getBlendEquationValue: (blendEquation: BlendEquation) => number;

        /**
         * 根据混合因子枚举获取真实值
         * @param blendFactor    混合因子枚举
         */
        readonly getBlendFactorValue: (blendFactor: BlendFactor) => number;

        /**
         * 根据裁剪面枚举获取真实值
         * @param cullFace  裁剪面枚举
         */
        readonly getCullFaceValue: (cullFace: CullFace) => number;

        /**
         * 根据正面方向枚举获取真实值
         * @param frontFace  正面方向枚举
         */
        readonly getFrontFaceValue: (frontFace: FrontFace) => number;

        /**
         * 根据纹理颜色格式枚举获取真实值
         * @param textureFormat  纹理颜色格式枚举
         */
        readonly getTextureFormatValue: (textureFormat: TextureFormat) => number;

        /**
         * 根据纹理数据类型枚举获取真实值
         * @param textureDataType  纹理数据类型枚举
         */
        readonly getTextureDataTypeValue: (textureDataType: TextureDataType) => number;

        /**
         * 根据纹理缩小过滤器枚举获取真实值
         * @param textureMinFilter  纹理缩小过滤器枚举
         */
        readonly getTextureMinFilterValue: (textureMinFilter: TextureMinFilter) => number;

        /**
         * 根据纹理放大滤波器枚举获取真实值
         * @param textureMagFilter  纹理放大滤波器枚举
         */
        readonly getTextureMagFilterValue: (textureMagFilter: TextureMagFilter) => number;

        /**
         * 根据纹理坐标包装函数枚举获取真实值
         * @param textureWrapS  纹理坐标s包装函数枚举
         */
        readonly getTextureWrapValue: (textureWrapS: TextureWrap) => number;

        /**
         * 根据纹理坐标包装函数枚举获取真实值
         * @param glArrayType  纹理坐标s包装函数枚举
         */
        readonly getGLArrayTypeValue: (glArrayType: GLArrayType) => number;

        /**
         * 根据深度检测方法枚举获取真实值
         * @param depthFunc  深度检测方法枚举
         */
        readonly getdDepthFuncValue: (depthFunc: DepthFunc) => number;

        constructor(gl: GL)
        {
            assert(!gl.enums, `${gl} ${gl.enums} 存在！`);

            gl.enums = this;
            this.getRenderModeValue = enums.getRenderModeValue(gl);
            this.getTextureTypeValue = enums.getTextureTypeValue(gl);
            this.getBlendEquationValue = enums.getBlendEquationValue(gl);
            this.getBlendFactorValue = enums.getBlendFactorValue(gl);
            this.getCullFaceValue = enums.getCullFaceValue(gl);
            this.getFrontFaceValue = enums.getFrontFaceValue(gl);
            this.getTextureFormatValue = enums.getTextureFormatValue(gl);
            this.getTextureDataTypeValue = enums.getTextureDataTypeValue(gl);
            this.getTextureMinFilterValue = enums.getTextureMinFilterValue(gl);
            this.getTextureMagFilterValue = enums.getTextureMagFilterValue(gl);
            this.getTextureWrapValue = enums.getTextureWrapValue(gl);
            this.getGLArrayTypeValue = enums.getGLArrayTypeValue(gl);
            this.getdDepthFuncValue = enums.getdDepthFuncValue(gl);
        }
    }
}