module feng3d
{

    /**
     * 材质
     * @author feng 2016-05-02
     */
    export class Material extends RenderDataHolder
    {
        /**
        * 渲染模式，默认RenderMode.TRIANGLES
        */
        @serialize(RenderMode.TRIANGLES)
        @oav()
        get renderMode()
        {
            return this._renderMode;
        }
        set renderMode(value)
        {
            this._renderMode = value;
            this.createBoolMacro("IS_POINTS_MODE", this.renderMode == RenderMode.POINTS);
            this.createShaderParam("renderMode", this.renderMode);
        }
        private _renderMode: number;

        @serialize()
        get shaderName()
        {
            return this._shaderName;
        }
        set shaderName(value)
        {
            if (this._shaderName == value)
                return;
            this._shaderName = value;
            this.vertexCode = ShaderLib.getShaderCode(this._shaderName + ".vertex");
            this.fragmentCode = ShaderLib.getShaderCode(this._shaderName + ".fragment")
        }
        private _shaderName: string;

        /**
         * 顶点渲染程序代码
         */
        get vertexCode()
        {
            return this._vertexCode;
        }
        set vertexCode(value)
        {
            if (this._vertexCode == value)
                return;
            this._vertexCode = value;
            this.createvertexCode(this._vertexCode);
        }
        private _vertexCode: string;

        /**
         * 片段渲染程序代码
         */
        get fragmentCode()
        {
            return this._fragmentCode;
        }
        set fragmentCode(value)
        {
            if (this._fragmentCode == value)
                return;
            this._fragmentCode = value;
            this.createfragmentCode(this._fragmentCode);
        }
        private _fragmentCode: string;

        /**
         * 剔除面
         * 参考：http://www.jianshu.com/p/ee04165f2a02
         * 默认情况下，逆时针的顶点连接顺序被定义为三角形的正面。
         * 使用gl.frontFace(GL.CW);调整顺时针为正面
         */
        @serialize(GL.BACK)
        @oav()
        cullFace = GL.BACK;
        // GL.FRONT
        // GL.BACK
        // GL.FRONT_AND_BACK

        /**
         * 是否开启混合
         * <混合后的颜色> = <源颜色>*sfactor + <目标颜色>*dfactor
         */
        @serialize(false)
        @oav()
        get enableBlend()
        {
            return this._enableBlend;
        }

        set enableBlend(value: boolean)
        {
            this._enableBlend = value;
        }
        protected _enableBlend = false;

        /**
         * 点绘制时点的尺寸
         */
        @serialize(1)
        @oav()
        get pointSize()
        {
            return this._pointSize;
        }

        set pointSize(value)
        {
            this._pointSize = value;
            this.createUniformData("u_PointSize", this.pointSize);
        }
        protected _pointSize = 1;

        /**
         * 混合方程，默认BlendEquation.FUNC_ADD
         */
        @serialize(BlendEquation.FUNC_ADD)
        @oav()
        blendEquation = BlendEquation.FUNC_ADD;

        /**
         * 源混合因子，默认BlendFactor.SRC_ALPHA
         */
        @serialize(BlendFactor.SRC_ALPHA)
        @oav()
        sfactor = BlendFactor.SRC_ALPHA;

        /**
         * 目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA
         */
        @serialize(BlendFactor.ONE_MINUS_SRC_ALPHA)
        @oav()
        dfactor = BlendFactor.ONE_MINUS_SRC_ALPHA;

        /**
         * 开启深度检查
         */
        depthtest = true;

        protected _methods: RenderDataHolder[] = [];

        @serialize()
        @oav()
        get methods()
        {
            return this._methods;
        }

        set methods(value)
        {
            for (var i = this._methods.length - 1; i >= 0; i--)
            {
                this.removeMethod(this._methods[i]);
            }
            for (var i = 0, n = value.length; i < n; i++)
            {
                this.addMethod(value[i]);
            }
        }

        constructor()
        {
            super();
            this.renderMode = RenderMode.TRIANGLES
        }

        /**
         * 添加方法
         */
        addMethod(method: RenderDataHolder)
        {
            if (!method)
                return;
            var index = this._methods.indexOf(method);
            if (index != -1)
                return;
            this._methods.push(method);
            this.addRenderDataHolder(method);
        }

        /**
         * 删除方法
         */
        removeMethod(method: RenderDataHolder)
        {
            var index = this._methods.indexOf(method);
            if (index == -1)
                return;
            this._methods.splice(index, 1);
            this.removeRenderDataHolder(method);
        }
    }
}
