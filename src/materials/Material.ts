module feng3d
{

    /**
     * 材质
     * @author feng 2016-05-02
     */
    export class Material extends RenderDataHolder
    {
        protected _pointSize = 1;
        protected _enableBlend = false;

        /**
        * 渲染模式，默认RenderMode.TRIANGLES
        */
        public renderMode = RenderMode.TRIANGLES;

        /**
         * 着色器名称
         */
        protected shaderName: string;

        /**
         * 是否渲染双面
         */
        public bothSides = true;

        /**
         * 是否开启混合
         * <混合后的颜色> = <源颜色>*sfactor + <目标颜色>*dfactor
         */
        public get enableBlend()
        {
            return this._enableBlend;
        }

        public set enableBlend(value: boolean)
        {
            this._enableBlend = value;
        }

        /**
         * 点绘制时点的尺寸
         */
        public get pointSize()
        {
            return this._pointSize;
        }

        public set pointSize(value)
        {
            this._pointSize = value;
            this.invalidateRenderData();
        }

        /**
         * 混合方程，默认BlendEquation.FUNC_ADD
         */
        public blendEquation = BlendEquation.FUNC_ADD;

        /**
         * 源混合因子，默认BlendFactor.SRC_ALPHA
         */
        public sfactor = BlendFactor.SRC_ALPHA;

        /**
         * 目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA
         */
        public dfactor = BlendFactor.ONE_MINUS_SRC_ALPHA;

        private _methods: RenderDataHolder[] = [];

        /**
         * 构建材质
         */
        constructor()
        {
            super();
            this._single = true;
            this._type = Material;

            Watcher.watch(this, ["shaderName"], this.invalidateRenderData, this);
            Watcher.watch(this, ["renderMode"], this.invalidateRenderData, this);
        }

        /**
         * 添加方法
         */
        public addMethod(method: RenderDataHolder)
        {
            var index = this._methods.indexOf(method);
            if (index != -1)
                return;
            this._methods.push(method);
            this.invalidateRenderHolder();
        }

        /**
         * 删除方法
         */
        public removeMethod(method: RenderDataHolder)
        {
            var index = this._methods.indexOf(method);
            if (index != -1)
            {
                this._methods.splice(index, 1);
                this.invalidateRenderData();
            }
        }
        
        /**
         * 收集渲染数据拥有者
         * @param renderAtomic 渲染原子
         */
        public collectRenderDataHolder(renderAtomic: Object3DRenderAtomic = null)
        {
            for (var i = 0; i < this._methods.length; i++)
            {
                this._methods[i].collectRenderDataHolder(renderAtomic);
            }
            super.collectRenderDataHolder(renderAtomic);
        }
        
        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            //
            renderData.shaderParams.renderMode = this.renderMode;
            //
            if (this.shaderName)
            {
                renderData.vertexCode = ShaderLib.getShaderCode(this.shaderName + ".vertex");
                renderData.fragmentCode = ShaderLib.getShaderCode(this.shaderName + ".fragment");
            } else
            {
                renderData.vertexCode = null;
                renderData.fragmentCode = null;
            }
            if (this.renderMode == RenderMode.POINTS)
            {
                renderData.shaderMacro.boolMacros.IS_POINTS_MODE = true;
                renderData.uniforms.u_PointSize = this.pointSize;
            } else
            {
                renderData.shaderMacro.boolMacros.IS_POINTS_MODE = false;
                delete renderData.uniforms.u_PointSize;
            }

            for (var i = 0; i < this._methods.length; i++)
            {
                this._methods[i].updateRenderData(renderContext, renderData);
            }
            super.updateRenderData(renderContext, renderData);
        }
    }
}
