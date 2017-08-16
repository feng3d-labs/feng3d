namespace feng3d
{

    /**
     * 渲染器
     * @author feng 2016-05-01
     */
    export class Renderer extends Component
    {
        /**
         * 材质
         * Returns the first instantiated Material assigned to the renderer.
         */
        @serialize
        get material() { return this._material }
        set material(value)
        {
            if (this._material == value)
                return;
            if (this._material)
                this.removeRenderDataHolder(this._material);
            this._material = value;
            if (this._material)
                this.addRenderDataHolder(this.material);
        }
        private _material: Material;

        /**
         * Makes the rendered 3D object visible if enabled.
         */
        @serialize
        get enabled()
        {
            return this._enabled;
        }
        set enable(value)
        {
            this._enabled = value;
        }
        private _enabled: boolean;

        constructor(gameObject: GameObject)
        {
            super(gameObject);
        }

        drawRenderables(renderContext: RenderContext)
        {
            var object3D = this.gameObject;
            //更新数据
            object3D.updateRender(renderContext);
            var gl = renderContext.gl;
            // try
            // {
            //绘制
            var material = this.material;
            if (material.enableBlend)
            {
                //
                gl.enable(GL.BLEND);
                gl.blendEquation(material.blendEquation);
                gl.depthMask(false);
                gl.blendFunc(material.sfactor, material.dfactor);
            } else
            {
                gl.disable(GL.BLEND);
                gl.depthMask(true);
            }
            this.drawObject3D(gl, object3D._renderData);            //
            // } catch (error)
            // {
            //     console.log(error);
            // }
        }

        /**
         * 绘制3D对象
         */
        protected drawObject3D(gl: GL, renderAtomic: RenderAtomic, shader: ShaderRenderData = null)
        {
            shader = shader || renderAtomic.shader;
            var shaderProgram = shader.activeShaderProgram(gl);
            if (!shaderProgram)
                return;
            //
            renderAtomic.activeAttributes(gl, shaderProgram.attributes);
            renderAtomic.activeUniforms(gl, shaderProgram.uniforms);
            renderAtomic.dodraw(gl);
        }

        /**
         * 销毁
         */
        dispose()
        {
            super.dispose();
            this.material = null;
        }
    }
}