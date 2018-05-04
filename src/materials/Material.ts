namespace feng3d
{

    /**
     * 材质
     * @author feng 2016-05-02
     */
    // @ov({ component: "OVMaterial" })
    export class Material extends EventDispatcher
    {
        @oav({ component: "OAVMaterialName" })
        @watch("onShaderChanged")
        shaderName: string;

        @serialize()
        // @oav({ component: "OAVMaterialData" })
        @oav()
        uniforms = {};

        /**
         * 渲染参数
         */
        @serialize()
        @oav({ block: "渲染参数" })
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
                    renderAtomic.uniforms[key] = this.uniforms[key];
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
