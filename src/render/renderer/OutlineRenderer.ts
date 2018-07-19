namespace feng3d
{
    /**
     * 轮廓渲染器
     */
    export var outlineRenderer: OutlineRenderer;

    /**
     * 轮廓渲染器
     */
    export class OutlineRenderer
    {
        renderAtomic: RenderAtomic;

        init()
        {
            if (!this.renderAtomic)
            {
                this.renderAtomic = new RenderAtomic();
                var renderParams = this.renderAtomic.renderParams;
                renderParams.enableBlend = false;
                renderParams.cullFace = CullFace.FRONT;

                this.renderAtomic.shader = new Shader("outline");
            }
        }

        draw(gl: GL, scene3d: Scene3D, camera: Camera)
        {
            var unblenditems = scene3d.getPickCache(camera).unblenditems;

            for (var i = 0; i < unblenditems.length; i++)
            {
                var item = unblenditems[i];
                if (item.getComponent(OutLineComponent) || item.getComponent(CartoonComponent))
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
            this.init();

            var renderAtomic = gameObject.renderAtomic;
            gameObject.preRender(renderAtomic);

            this.renderAtomic.next = renderAtomic;

            gl.renderer.draw(this.renderAtomic);
        }
    }

    outlineRenderer = new OutlineRenderer();

    export class OutLineComponent extends Component
    {
        @oav()
        @serialize
        size = 1;

        @oav()
        @serialize
        color = new Color4(0.2, 0.2, 0.2, 1.0);

        @oav()
        @serialize
        outlineMorphFactor = 0.0;

        init(gameobject: GameObject)
        {
            super.init(gameobject);
        }

        preRender(renderAtomic: RenderAtomic)
        {
            renderAtomic.uniforms.u_outlineSize = () => this.size;
            renderAtomic.uniforms.u_outlineColor = () => this.color;
            renderAtomic.uniforms.u_outlineMorphFactor = () => this.outlineMorphFactor;
        }
    }

    export interface Uniforms
    {
        /**
         * 描边宽度
         */
        u_outlineSize: number;
        /**
         * 描边颜色
         */
        u_outlineColor: Color4;
        /**
         * 描边形态因子
         * (0.0，1.0):0.0表示延法线方向，1.0表示延顶点方向
         */
        u_outlineMorphFactor: number;

    }
}