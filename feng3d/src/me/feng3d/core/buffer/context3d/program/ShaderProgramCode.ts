module me.feng3d {

    /**
     * 渲染程序代码
     * @author feng 2016-05-19
     */
    export class ShaderProgramCode extends EventDispatcher {

        private _vertexCode: string;
        private _fragmentCode: string;

        /**
         * @param vertexCode        顶点渲染程序代码
         * @param fragmentCode      片段渲染程序代码
         */
        constructor(vertexCode: string, fragmentCode: string) {
            super();

            this.vertexCode = vertexCode;
            this.fragmentCode = fragmentCode;
        }

        /**
         * 顶点渲染程序代码
         */
        get vertexCode(): string {

            return this._vertexCode;
        }

        set vertexCode(value: string) {

            this._vertexCode = value;
            this.dispatchEvent(new ShaderProgramCodeEvent(ShaderProgramCodeEvent.VERTEXCODE_CHANGE));
        }

        /**
         * 片段渲染程序代码
         */
        get fragmentCode(): string {

            return this._fragmentCode;
        }

        set fragmentCode(value: string) {

            this._fragmentCode = value;
            this.dispatchEvent(new ShaderProgramCodeEvent(ShaderProgramCodeEvent.FRAGMENTCODE_CHANGE));
        }

        /**
         * 获取程序属性列表
         */
        static getAttributes(code: string) {

            var attributeReg = /attribute\s+(\w+)\s+(\w+)/g;
            var result = attributeReg.exec(code);

            var attributes: ProgramAttribute[] = [];
            while (result) {
                var attribute = new ProgramAttribute();
                attribute.type = result[1];
                attribute.name = result[2];
                attributes.push(attribute);
                result = attributeReg.exec(code);
            }

            return attributes;
        }
    }

    /**
     * 渲染程序代码事件
     * @author feng 2016-05-19
     */
    export class ShaderProgramCodeEvent extends Event {

        /**
         * 顶点渲染程序代码改变
         */
        static VERTEXCODE_CHANGE = "vertexCodeChange";

        /**
         * 片段渲染程序代码改变
         */
        static FRAGMENTCODE_CHANGE = "fragmentCodeChange";

        /**
         * 创建一个渲染程序代码事件。
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type: string, data?: any, bubbles?: boolean) {
            super(type, data);
        }
    }
}