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

        static create<K extends keyof UniformsMap>(shaderName: K, uniforms?: gPartial<UniformsMap[K]>, renderParams?: gPartial<RenderParams>)
        {
            var material = new Material();
            material.init(shaderName, uniforms, renderParams);
            return material;
        }

        init<K extends keyof UniformsMap>(shaderName: K, uniforms?: gPartial<UniformsMap[K]>, renderParams?: gPartial<RenderParams>)
        {
            this.shaderName = shaderName;
            //
            uniforms && serialization.setValue(this.uniforms, <any>uniforms);
            renderParams && serialization.setValue(this.renderParams, renderParams);
            return this;
        }

        //
        private renderAtomic = new RenderAtomic();

        @oav({ component: "OAVFeng3dPreView" })
        private preview = "";

        /**
         * shader名称
         */
        @oav({ component: "OAVMaterialName" })
        @serialize
        get shaderName()
        {
            return this._shaderName;
        }
        set shaderName(v)
        {
            if (this._shaderName == v) return;
            this._shaderName = v;
            this.onShaderChanged();
        }
        private _shaderName: ShaderNames;

        @oav({ editable: false })
        @serialize
        name = "";

        /**
         * Uniform数据
         */
        @serialize
        @oav({ component: "OAVObjectView" })
        get uniforms()
        {
            return this._uniforms;
        }
        set uniforms(v)
        {
            if (this._uniforms == v) return;
            this._uniforms = v;
            this.onUniformsChanged();
        }
        private _uniforms: UniformsData;

        /**
         * 渲染参数
         */
        @serialize
        @oav({ block: "渲染参数", component: "OAVObjectView" })
        get renderParams()
        {
            return this._renderParams;
        }
        set renderParams(v)
        {
            if (this._renderParams == v) return;
            this._renderParams = v;
            this.onRenderParamsChanged();
        }
        private _renderParams: RenderParams;

        constructor()
        {
            super();
            dispatcher.on("asset.shaderChanged", this.onShaderChanged, this);
            this.shaderName = "standard";
            this.uniforms = new StandardUniforms();
            this.renderParams = new RenderParams();
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
                    this.uniforms = newuniforms;
                }
            } else
            {
                this.uniforms = <any>{};
            }

            var renderParams = shaderConfig.shaders[this.shaderName].renderParams;
            renderParams && serialization.setValue(this.renderParams, renderParams);

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
         * 设置默认材质
         * 
         * 资源名称与材质名称相同，且无法在检查器界面中编辑。
         * 
         * @param name 材质名称
         * @param material 材质数据
         */
        static setDefaultMaterial<K extends keyof DefaultMaterial>(name: K, material: gPartial<Material>)
        {
            var newMaterial = this._defaultMaterials[<any>name] = new Material();
            serialization.setValue(newMaterial, material);
            serialization.setValue(newMaterial, { name: name, assetId: name, hideFlags: HideFlags.NotEditable });
            AssetData.addAssetData(name, newMaterial);
        }

        /**
         * 获取材质
         * 
         * @param name 材质名称
         */
        static getDefaultMaterial<K extends keyof DefaultMaterial>(name: K)
        {
            return this._defaultMaterials[name];
        }
        private static _defaultMaterials: DefaultMaterial = <any>{};
    }

    /**
     * 默认材质
     */
    export interface DefaultMaterial
    {
    }
}