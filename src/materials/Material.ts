namespace feng3d
{
    export interface UniformsMap { }
    export type ShaderNames = keyof UniformsMap;
    export type UniformsData = UniformsMap[keyof UniformsMap];

    /**
     * 材质
     */
    export class Material extends Feng3dAssets
    {
        __class__: "feng3d.Material" = "feng3d.Material";

        assetType = AssetExtension.material;

        /**
         * shader名称
         */
        @oav({ component: "OAVMaterialName" })
        @serialize
        @watch("onShaderChanged")
        shaderName: ShaderNames = "standard";

        @oav()
        name = "";

        /**
         * Uniform数据
         */
        @serialize
        @oav({ component: "OAVObjectView" })
        uniforms: UniformsData = new StandardUniforms();

        /**
         * 渲染参数
         */
        @serialize
        @oav({ block: "渲染参数", component: "OAVObjectView" })
        renderParams = new RenderParams();

        constructor()
        {
            super();
            feng3dDispatcher.on("assets.shaderChanged", this.onShaderChanged, this);
        }

        beforeRender(renderAtomic: RenderAtomic)
        {
            for (const key in this.uniforms)
            {
                if (this.uniforms.hasOwnProperty(key))
                {
                    renderAtomic.uniforms[<any>key] = this.uniforms[key];
                }
            }
            renderAtomic.shader = this._shader;
            renderAtomic.renderParams = this.renderParams;

            renderAtomic.shaderMacro.IS_POINTS_MODE = this.renderParams.renderMode == RenderMode.POINTS;
        }

        /**
         * 已加载完成或者加载完成时立即调用
         * @param callback 完成回调
         */
        onLoadCompleted(callback: () => void)
        {
            var uniforms = this.uniforms;
            var loadingNum = 0;
            for (const key in uniforms)
            {
                var texture = uniforms[key];
                if (texture instanceof UrlImageTexture2D || texture instanceof TextureCube)
                {
                    var loaded = false;
                    texture.onLoadCompleted(() =>
                    {
                        loaded = true;
                    });
                    if (!loaded)
                    {
                        loadingNum++;
                        texture.once("loadCompleted", () =>
                        {
                            loadingNum--;
                            if (loadingNum == 0) callback();
                        });
                    }
                }
            }
            if (loadingNum == 0) callback();
        }

        /**
         * 渲染程序
         */
        private _shader: Shader;

        private onShaderChanged()
        {
            var cls = shaderConfig.shaders[this.shaderName].cls;
            if (cls)
            {
                if (!(this.uniforms instanceof cls))
                {
                    var newuniforms = new cls();
                    serialization.setValue(newuniforms, <any>this.uniforms);
                    this.uniforms = newuniforms;
                }
            } else
            {
                this.uniforms = <any>{};
            }
            this._shader = new Shader(this.shaderName);
        }

        /**
         * 默认材质
         */
        static default: Material;

        /**
         * 默认水材质
         */
        static defaultWater: Material;
    }

    Feng3dAssets.setAssets(Material.default = new Material().value({ name: "Default-Material", assetsId: "Default-Material", hideFlags: HideFlags.NotEditable }));
}
