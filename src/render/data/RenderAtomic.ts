module feng3d {

    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     * @author feng 2016-06-20
     */
    export class RenderAtomic {

        /**
         * 顶点索引缓冲
         */
        public indexBuffer: IndexRenderData;

        /**
         * 顶点渲染程序代码
         */
        public vertexCode: string;

        /**
         * 片段渲染程序代码
         */
        public fragmentCode: string;

        /**
         * 属性数据列表
         */
        public attributes: { [name: string]: AttributeRenderData } = {};

        /**
         * 常量数据（包含纹理）列表
         */
        public uniforms: { [name: string]: Matrix3D | Vector3D | TextureInfo | Vector3D[]; } = {};

        /**
         * 渲染参数
         */
        public shaderParams: ShaderParams = <any>{};

        /**
         * 着色器宏定义
         */
        public shaderMacro = new ShaderMacro();
    }

    /**
     * 渲染所需数据
     * @author feng 2016-12-28
     */
    export class RenderData extends RenderAtomic { }
}