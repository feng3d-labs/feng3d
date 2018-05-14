namespace feng3d
{

    export interface MaterialRawMap
    {
    }
    export type MaterialRaw = ValueOf<MaterialRawMap>;

    /**
     * 基础材质原始数据
     */
    export interface MaterialBaseRaw
    {
        __class__?: "feng3d.Material";
        shaderName?: string,
        uniforms?: Object,
        renderParams?: Partial<RenderParams>,
    }

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
        create(shader: string, raw?: MaterialRaw)
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
    export class Material
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

        constructor(raw?: MaterialRaw)
        {
            serialization.setValue(this, raw);
            globalEvent.on("shaderChanged", this.onShaderChanged, this);
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
                    // serialization.setValue(newuniforms, this.uniforms);
                    this.uniforms = newuniforms;
                }
            }
            this.shader = shaderlib.getShader(this.shaderName);
        }
    }
}
