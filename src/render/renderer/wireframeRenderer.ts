namespace feng3d
{
    /**
     * 线框渲染器
     */
    export var wireframeRenderer = {
        draw: draw,
    };

    var shadername = "wireframe";
    var renderParams: RenderParams;

    function init()
    {
        if (!renderParams)
        {
            renderParams = new RenderParams();
            renderParams.renderMode = RenderMode.LINES;
            renderParams.enableBlend = false;
            renderParams.depthMask = false;
            renderParams.depthtest = true;
            renderParams.depthFunc = DepthFunc.LEQUAL;
        }
    }

    /**
     * 渲染
     */
    function draw(renderContext: RenderContext, unblenditems: {
        depth: number;
        item: MeshRenderer;
        enableBlend: boolean;
    }[])
    {
        if (unblenditems.length == 0)
            return;

        var gl = renderContext.gl;

        for (var i = 0; i < unblenditems.length; i++)
        {
            var item = unblenditems[i].item;
            if (item.getComponent(WireframeComponent))
            {
                var renderAtomic = item.getComponent(RenderAtomicComponent);
                var meshRenderer = item.getComponent(MeshRenderer);
                drawGameObject(gl, renderAtomic.renderAtomic, meshRenderer.material);            //
            }
        }
    }

    /**
     * 绘制3D对象
     */
    function drawGameObject(gl: GL, renderAtomic: RenderAtomic, material: Material)
    {
        var renderMode = lazy.getvalue(material.renderParams.renderMode);
        if (renderMode == RenderMode.POINTS
            || renderMode == RenderMode.LINES
            || renderMode == RenderMode.LINE_LOOP
            || renderMode == RenderMode.LINE_STRIP
        )
            return;

        init();

        var oldshadername = renderAtomic.shadername;

        var oldrenderParams = material.renderParams;
        material.renderParams = renderParams;

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

        gl.renderer.draw(renderAtomic, material);

        renderAtomic.indexBuffer = oldIndexBuffer;
        //
        renderAtomic.shadername = oldshadername;
        material.renderParams = oldrenderParams;
    }

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
        color = new Color(125 / 255, 176 / 255, 250 / 255);

        init(gameobject: GameObject)
        {
            super.init(gameobject);
            this.createUniformData("u_wireframeColor", () => this.color);
        }
    }
}