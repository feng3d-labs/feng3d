namespace feng3d
{
    /**
     * 线框渲染器
     */
    export var wireframeRenderer: WireframeRenderer;

    export class WireframeRenderer
    {
        private renderAtomic: RenderAtomic;

        init()
        {
            if (!this.renderAtomic)
            {
                this.renderAtomic = new RenderAtomic();
                var renderParams = this.renderAtomic.renderParams;
                renderParams.renderMode = RenderMode.LINES;
                // renderParams.depthMask = false;
            }
        }

        /**
         * 渲染
         */
        draw(gl: GL, scene3d: Scene3D, camera: Camera)
        {
            var unblenditems = scene3d.getPickCache(camera).unblenditems;

            var wireframes = unblenditems.reduce((pv: WireframeComponent[], cv) => { var wireframe = cv.getComponent(WireframeComponent); if (wireframe) pv.push(wireframe); return pv; }, [])

            if (wireframes.length == 0)
                return;

            wireframes.forEach(element =>
            {
                this.drawGameObject(gl, element.gameObject, scene3d, camera, element.color);            //
            });
        }

        /**
         * 绘制3D对象
         */
        drawGameObject(gl: GL, gameObject: GameObject, scene3d: Scene3D, camera: Camera, wireframeColor = new Color4())
        {
            var renderAtomic = gameObject.renderAtomic;
            gameObject.beforeRender(gl, renderAtomic, scene3d, camera);

            var renderMode = lazy.getvalue(renderAtomic.renderParams.renderMode);
            if (renderMode == RenderMode.POINTS
                || renderMode == RenderMode.LINES
                || renderMode == RenderMode.LINE_LOOP
                || renderMode == RenderMode.LINE_STRIP
            )
                return;

            this.init();

            var uniforms = this.renderAtomic.uniforms;
            //
            uniforms.u_projectionMatrix = camera.lens.matrix;
            uniforms.u_viewProjection = camera.viewProjection;
            uniforms.u_viewMatrix = camera.transform.worldToLocalMatrix;
            uniforms.u_cameraMatrix = camera.transform.localToWorldMatrix;
            uniforms.u_cameraPos = camera.transform.scenePosition;
            uniforms.u_skyBoxSize = camera.lens.far / Math.sqrt(3);
            uniforms.u_scaleByDepth = camera.getScaleByDepth(1);

            //
            this.renderAtomic.next = renderAtomic;

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
            renderAtomic.wireframeShader = renderAtomic.wireframeShader || new Shader("wireframe");
            this.renderAtomic.indexBuffer = renderAtomic.wireframeindexBuffer;

            this.renderAtomic.uniforms.u_wireframeColor = wireframeColor;

            //
            this.renderAtomic.shader = renderAtomic.wireframeShader;
            gl.renderer.draw(this.renderAtomic);
            this.renderAtomic.shader = null;
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

        wireframeShader: Shader;
    }
}