module feng3d {

    /**
     * 渲染参数
     * @author feng 2016-12-14
     */
    export class ShaderParams {

        /**
         * 渲染模式
         */
        public renderMode = RenderMode.TRIANGLES;

        /**
         * 重置
         */
        public reset() {

            defaultShaderParams = defaultShaderParams || new ShaderParams();
            var propertyNames = Object.getOwnPropertyNames(this);
            propertyNames.forEach(name => {
                this[name] = defaultShaderParams[name];
            });
        }
    }

    var defaultShaderParams: ShaderParams;
}