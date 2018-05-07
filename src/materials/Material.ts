namespace feng3d
{

    export class MaterialFactory
    {
        create(shader: string)
        {
            var material = new Material();
            material.shaderName = shader;
            return material;
        }
    }

    export var materialFactory = new MaterialFactory();

    /**
     * 材质
     * @author feng 2016-05-02
     */
    export class Material extends EventDispatcher
    {

        @oav({ component: "OAVMaterialName" })
        @watch("onShaderChanged")
        shaderName: string;

        @serialize
        // @oav({ component: "OAVMaterialData" })
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

        constructor()
        {
            super();

            this.shader = new Shader();
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
                    this.uniforms = new cls();
            }
        }
    }
}
