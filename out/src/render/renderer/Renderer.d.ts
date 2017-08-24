declare namespace feng3d {
    /**
     * 渲染器
     * @author feng 2016-05-01
     */
    class Renderer extends Component {
        /**
         * 材质
         * Returns the first instantiated Material assigned to the renderer.
         */
        material: Material;
        private _material;
        /**
         * Makes the rendered 3D object visible if enabled.
         */
        readonly enabled: boolean;
        enable: any;
        private _enabled;
        constructor(gameObject: GameObject);
        drawRenderables(renderContext: RenderContext): void;
        /**
         * 绘制3D对象
         */
        protected drawObject3D(gl: GL, renderAtomic: RenderAtomic, shader?: ShaderRenderData): void;
        /**
         * 销毁
         */
        dispose(): void;
    }
}
