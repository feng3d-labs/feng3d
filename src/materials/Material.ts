namespace feng3d
{

    export interface MaterialRawMap
    {
    }
    export type MaterialRaw = ValueOf<MaterialRawMap>;

    export interface MaterialBaseRaw
    {
        __class__?: "feng3d.Material";
        shaderName?: string,
        uniforms?: Object,
        renderParams?: Partial<RenderParams>,
    }

    export class MaterialFactory
    {
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
        shaderName: string;

        /**
         * Uniform数据
         */
        @serialize
        @oav({ component: "OAVObjectView" })
        uniforms = {};

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
            this.shader = new Shader();
            serialization.setValue(this, raw);
        }

        preRender(renderAtomic: RenderAtomic)
        {
            this.shader.shaderName = this.shaderName;

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
        }
    }
}
