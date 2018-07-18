namespace feng3d
{
    /**
     * 线框渲染器
     */
    export var wireframeRenderer: WireframeRenderer;

    export class WireframeRenderer
    {
        renderAtomic: RenderAtomic;

        private shader: Shader;
        private skeleton_shader: Shader;

        init()
        {
            if (!this.renderAtomic)
            {
                this.renderAtomic = new RenderAtomic();
                var renderParams = this.renderAtomic.renderParams;
                renderParams.renderMode = RenderMode.LINES;
                renderParams.enableBlend = false;
                renderParams.depthMask = false;
                renderParams.depthtest = true;
                renderParams.depthFunc = DepthFunc.LEQUAL;

                this.shader = new Shader("wireframe");
                this.skeleton_shader = new Shader("wireframe_skeleton");
            }
        }

        /**
         * 渲染
         */
        draw(gl: GL, scene3d: Scene3D, camera: Camera)
        {
            var unblenditems = scene3d.getPickCache(camera).unblenditems;

            if (unblenditems.length == 0)
                return;

            for (var i = 0; i < unblenditems.length; i++)
            {
                var item = unblenditems[i];
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

            this.renderAtomic.next = renderAtomic;
            if (meshRenderer instanceof SkinnedMeshRenderer)
            {
                this.renderAtomic.shader = this.skeleton_shader;
            } else
            {
                this.renderAtomic.shader = this.shader;
            }

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
            this.renderAtomic.indexBuffer = renderAtomic.wireframeindexBuffer;

            gl.renderer.draw(this.renderAtomic);
            //
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