namespace feng3d
{
    /**
     * 材质工厂
     */
    export class MaterialFactory
    {
        /**
         * 创建材质
         * @param shader shader名称
         * @param raw 材质数据
         */
        create(shader: string, raw?: gPartial<Material>)
        {
            raw = raw || {};
            raw.shaderName = <any>shader;
            var material = new Material(raw);
            return material;
        }
    }

    export var materialFactory = new MaterialFactory();

    /**
     * 材质
     * @author feng 2016-05-02
     */
    export class Material extends Feng3dAssets
    {
        /**
         * shader名称
         */
        @oav({ component: "OAVMaterialName" })
        @serialize
        @watch("onShaderChanged")
        shaderName = "standard";

        /**
         * Uniform数据
         */
        @serialize
        @oav({ component: "OAVObjectView" })
        uniforms = new StandardUniforms();

        /**
         * 渲染参数
         */
        @serialize
        @oav({ block: "渲染参数", component: "OAVObjectView" })
        renderParams = new RenderParams();

        /**
         * 渲染程序
         */
        shader: Shader;

        constructor(raw?: gPartial<Material>)
        {
            super();
            serialization.setValue(this, raw);
            feng3dDispatcher.on("assets.shaderChanged", this.onShaderChanged, this);
        }

        preRender(renderAtomic: RenderAtomic)
        {
            for (const key in this.uniforms)
            {
                if (this.uniforms.hasOwnProperty(key))
                {
                    renderAtomic.uniforms[<any>key] = this.uniforms[key];
                }
            }
        }

        private onShaderChanged()
        {
            var cls = shaderConfig.shaders[this.shaderName].cls
            if (cls)
            {
                if (!(this.uniforms instanceof cls))
                {
                    var newuniforms = new cls();
                    serialization.setValue(newuniforms, this.uniforms);
                    this.uniforms = newuniforms;
                }
            }
            this.shader = shaderlib.getShader(this.shaderName);
        }
    }
}
