module feng3d {

    /**
     * 渲染所需数据
     * @author feng 2016-12-28
     */
    export interface IRenderData {

        /**
         * 顶点索引缓冲
         */
        indexBuffer?: IndexRenderData;

        /**
         * 渲染程序名称（路径）
         */
        shaderName?: string;

        /**
         * 属性数据列表
         */
        attributes?: { [name: string]: AttributeRenderData };

        /**
         * 常量数据（包含纹理）列表
         */
        uniforms?: { [name: string]: Matrix3D | Vector3D | TextureInfo; };

        /**
         * 渲染参数
         */
        shaderParams?: ShaderParams;

        /**
         * 着色器宏定义
         */
        shaderMacro?: ShaderMacro;
    }
}