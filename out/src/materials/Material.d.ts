declare namespace feng3d {
    /**
     * 材质
     * @author feng 2016-05-02
     */
    class Material extends RenderDataHolder {
        protected _pointSize: number;
        protected _enableBlend: boolean;
        /**
        * 渲染模式，默认RenderMode.TRIANGLES
        */
        renderMode: number;
        private _renderMode;
        shaderName: string;
        private _shaderName;
        /**
         * 顶点渲染程序代码
         */
        vertexCode: string;
        private _vertexCode;
        /**
         * 片段渲染程序代码
         */
        fragmentCode: string;
        private _fragmentCode;
        /**
         * 是否渲染双面
         */
        bothSides: boolean;
        /**
         * 是否开启混合
         * <混合后的颜色> = <源颜色>*sfactor + <目标颜色>*dfactor
         */
        enableBlend: boolean;
        /**
         * 点绘制时点的尺寸
         */
        pointSize: number;
        /**
         * 混合方程，默认BlendEquation.FUNC_ADD
         */
        blendEquation: number;
        /**
         * 源混合因子，默认BlendFactor.SRC_ALPHA
         */
        sfactor: number;
        /**
         * 目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA
         */
        dfactor: number;
        private _methods;
        methods: RenderDataHolder[];
        /**
         * 构建材质
         */
        constructor();
        /**
         * 添加方法
         */
        addMethod(method: RenderDataHolder): void;
        /**
         * 删除方法
         */
        removeMethod(method: RenderDataHolder): void;
    }
}
