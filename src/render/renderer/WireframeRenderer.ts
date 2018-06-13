namespace feng3d
{
    /**
     * 线框渲染器
     */
    export var wireframeRenderer: WireframeRenderer;

    export class WireframeRenderer
    {
        private renderParams: RenderParams;
        private shader: Shader;
        private wireframe_skeleton_shader: Shader;

        init()
        {
            if (!this.renderParams)
            {
                var renderParams = this.renderParams = new RenderParams();
                renderParams.renderMode = RenderMode.LINES;
                renderParams.enableBlend = false;
                renderParams.depthMask = false;
                renderParams.depthtest = true;
                renderParams.depthFunc = DepthFunc.LEQUAL;

                this.shader = shaderlib.getShader("wireframe");
                this.wireframe_skeleton_shader = shaderlib.getShader("wireframe_skeleton");
            }
        }

        /**
         * 渲染
         */
        draw(gl: GL, unblenditems: {
            depth: number;
            item: MeshRenderer;
            enableBlend: boolean;
        }[])
        {
            if (unblenditems.length == 0)
                return;

            for (var i = 0; i < unblenditems.length; i++)
            {
                var item = unblenditems[i].item;
                if (item.getComponent(WireframeComponent))
                {
                    this.drawGameObject(gl, item.gameObject);            //
                }
            }
        }

        /**
         * 绘制3D对象
         */
        drawGameObject(gl: GL, gameObject: GameObject)
        {
            var renderAtomic = gameObject.renderAtomic;
            gameObject.preRender(renderAtomic);
            var meshRenderer = gameObject.getComponent(MeshRenderer);

            var renderMode = lazy.getvalue(renderAtomic.renderParams.renderMode);
            if (renderMode == RenderMode.POINTS
                || renderMode == RenderMode.LINES
                || renderMode == RenderMode.LINE_LOOP
                || renderMode == RenderMode.LINE_STRIP
            )
                return;

            this.init();

            var oldshader = renderAtomic.shader;
            if (meshRenderer instanceof SkinnedMeshRenderer)
            {
                renderAtomic.shader = this.wireframe_skeleton_shader;
            } else
            {
                renderAtomic.shader = this.shader;
            }

            var oldrenderParams = renderAtomic.renderParams;
            renderAtomic.renderParams = this.renderParams;

            //
            var oldIndexBuffer = renderAtomic.indexBuffer;
            if (!renderAtomic.wireframeindexBuffer || renderAtomic.wireframeindexBuffer.count != 2 * oldIndexBuffer.count)
            {
                var wireframeindices: number[] = [];
                var indices = lazy.getvalue(oldIndexBuffer.indices);
                for (var i = 0; i < indices.length; i += 3)
                {
                    wireframeindices.push(
                        indices[i], indices[i + 1],
                        indices[i], indices[i + 2],
                        indices[i + 1], indices[i + 2],
                    );
                }
                renderAtomic.wireframeindexBuffer = new Index();
                renderAtomic.wireframeindexBuffer.indices = wireframeindices;
            }
            renderAtomic.indexBuffer = renderAtomic.wireframeindexBuffer;

            gl.renderer.draw(renderAtomic);

            renderAtomic.indexBuffer = oldIndexBuffer;
            //
            renderAtomic.shader = oldshader;
            renderAtomic.renderParams = oldrenderParams;
        }
    }

    wireframeRenderer = new WireframeRenderer();

    export interface RenderAtomic
    {
        /**
         * 顶点索引缓冲
         */
        wireframeindexBuffer: Index;
    }

    /**
     * 线框组件，将会对拥有该组件的对象绘制线框
     */
    export class WireframeComponent extends Component
    {
        serializable = false;
        showInInspector = false;

        @oav()
        color = new Color4(125 / 255, 176 / 255, 250 / 255);

        init(gameobject: GameObject)
        {
            super.init(gameobject);
        }

        preRender(renderAtomic: RenderAtomic)
        {
            super.preRender(renderAtomic);

            renderAtomic.uniforms.u_wireframeColor = () => this.color;
        }
    }
}