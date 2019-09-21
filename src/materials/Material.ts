namespace feng3d
{
    export interface UniformsMap { }
    export type ShaderNames = keyof UniformsMap;
    export type UniformsData = UniformsMap[keyof UniformsMap];

    /**
     * 材质
     */
    export class Material extends AssetData
    {
        __class__: "feng3d.Material" = "feng3d.Material";

        //
        private renderAtomic = new RenderAtomic();

        @oav({ component: "OAVFeng3dPreView" })
        private preview = "";

        /**
         * shader名称
         */
        @oav({ component: "OAVMaterialName" })
        @serialize
        @watch("onShaderChanged")
        shaderName: ShaderNames = "standard";

        @oav({ editable: false })
        @serialize
        name = "";

        /**
         * Uniform数据
         */
        @serialize
        @watch("onUniformsChanged")
        @oav({ component: "OAVObjectView" })
        uniforms: UniformsData = new StandardUniforms();

        /**
         * 渲染参数
         */
        @serialize
        @watch("onRenderParamsChanged")
        @oav({ block: "渲染参数", component: "OAVObjectView" })
        renderParams = new RenderParams();

        constructor()
        {
            super();
            dispatcher.on("asset.shaderChanged", this.onShaderChanged, this);
        }

        beforeRender(renderAtomic: RenderAtomic)
        {
            Object.assign(renderAtomic.uniforms, this.renderAtomic.uniforms);

            renderAtomic.shader = this.renderAtomic.shader;
            renderAtomic.renderParams = this.renderAtomic.renderParams;
            renderAtomic.shaderMacro.IS_POINTS_MODE = this.renderParams.renderMode == RenderMode.POINTS;
        }

        /**
         * 是否加载完成
         */
        get isLoaded()
        {
            var uniforms = this.uniforms;
            for (const key in uniforms)
            {
                var texture = uniforms[key];
                if (texture instanceof Texture2D || texture instanceof TextureCube)
                {
                    if (!texture.isLoaded) return false;
                }
            }
            return true;
        }

        /**
         * 已加载完成或者加载完成时立即调用
         * @param callback 完成回调
         */
        onLoadCompleted(callback: () => void)
        {
            var loadingNum = 0;
            var uniforms = this.uniforms;
            for (const key in uniforms)
            {
                var texture = uniforms[key];
                if (texture instanceof Texture2D || texture instanceof TextureCube)
                {
                    if (!texture.isLoaded)
                    {
                        loadingNum++;
                        texture.on("loadCompleted", () =>
                        {
                            loadingNum--;
                            if (loadingNum == 0) callback();
                        });
                    }
                }
            }
            if (loadingNum == 0) callback();
        }

        private onShaderChanged()
        {
            var cls = shaderConfig.shaders[this.shaderName].cls;
            if (cls)
            {
                if (this.uniforms == null || this.uniforms.constructor != cls)
                {
                    var newuniforms = new cls();
                    // Object.assign(newuniforms, this.uniforms);
                    this.uniforms = newuniforms;
                }
            } else
            {
                this.uniforms = <any>{};
            }
            this.renderAtomic.shader = new Shader(this.shaderName);
        }

        private onUniformsChanged()
        {
            this.renderAtomic.uniforms = <any>this.uniforms;
        }

        private onRenderParamsChanged()
        {
            this.renderAtomic.renderParams = this.renderParams;
        }

        /**
         * 默认材质
         */
        static default: Material;

        /**
         * 默认水材质
         */
        static water: Material;

        /**
         * 默认地形材质
         */
        static terrain: Material;

        /**
         * 粒子材质
         */
        static particle: Material;
    }
}
