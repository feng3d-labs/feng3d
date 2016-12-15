module feng3d {

    /**
     * 着色器加载器
     * @author feng 2016-12-15
     */
    export class ShaderLoader extends EventDispatcher {

        public static shadersRoot = "feng3d/shaders/";

        private request: XMLHttpRequest;

        private shaderName: string;

        /**
         * 顶点渲染程序代码
         */
        public vertexCode: string;

        /**
         * 片段渲染程序代码
         */
        public fragmentCode: string;

        public get isOk() {

            return this.vertexCode != null && this.fragmentCode != null;
        }

        /**
         * 加载渲染程序
         * @param url   路径
         */
        constructor(shaderName: string) {

            super();
            this.shaderName = shaderName;
            //
            var shaderLoader = new Loader();
            shaderLoader.addEventListener(LoaderEvent.COMPLETE, this.onVertexComplete, this)
            shaderLoader.loadText(ShaderLoader.shadersRoot + shaderName + ".vertex.glsl");
            var shaderLoader1 = new Loader();
            shaderLoader1.addEventListener(LoaderEvent.COMPLETE, this.onFragmentComplete, this)
            shaderLoader1.loadText(ShaderLoader.shadersRoot + shaderName + ".fragment.glsl");
        }

        /**
         * 顶点着色器加载完成
         */
        private onVertexComplete(event: LoaderEvent) {
            this.vertexCode = event.data.content;
        }

        /**
         * 片段着色器加载完成
         */
        private onFragmentComplete(event: LoaderEvent) {
            this.fragmentCode = event.data.content;
        }
    }
}