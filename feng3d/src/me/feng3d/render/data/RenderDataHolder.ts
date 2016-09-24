module me.feng3d {

    /**
	 * 渲染数据拥有者
	 * @author feng 2016-6-7
	 */
    export class RenderDataHolder extends Component {

		private indexBuffer: IndexRenderData;
		private programBuffer: ProgramRenderData;
		private attributes: { [name: string]: AttributeRenderData } = {};
		private uniforms: { [name: string]: UniformMatrix4fvRenderData } = {};

		/**
		 * 创建Context3D数据缓冲
		 */
        constructor() {

			super();

            this.addEventListener(Context3DBufferEvent.GET_INDEXBUFFER, this.onGetIndexBuffer, this);
			this.addEventListener(Context3DBufferEvent.GET_ATTRIBUTEBUFFER, this.onGetAttributeBuffer, this);
			this.addEventListener(Context3DBufferEvent.GET_UNIFORMBUFFER, this.onGetUniformBuffer, this);
			this.addEventListener(Context3DBufferEvent.GET_PROGRAMBUFFER, this.onGetProgramBuffer, this)
        }

		/**
		 * 映射索引缓冲
		 */
		mapIndexBuffer(value: Uint16Array) {
			var indexBuffer = this.indexBuffer = this.indexBuffer || new IndexRenderData();
			indexBuffer.indices = value;
		}

		/**
		 * 映射属性缓冲
		 */
		mapAttributeBuffer(name: string, value: Uint16Array, stride: number) {

			var attributeBuffer = this.attributes[name] = this.attributes[name] || new AttributeRenderData();
			attributeBuffer.name = name;
			attributeBuffer.data = value;
			attributeBuffer.size = stride;
		}

		/**
		 * 映射程序缓冲
         * @param vertexCode        顶点渲染程序代码
         * @param fragmentCode      片段渲染程序代码
         */
        mapProgram(vertexCode: string, fragmentCode: string) {

			var programBuffer = this.programBuffer = this.programBuffer || new ProgramRenderData();
			programBuffer.vertexCode = vertexCode;
			programBuffer.fragmentCode = fragmentCode;
		}

		/**
		 * 映射常量4*4矩阵
		 */
		mapUniformMatrix4fv(name: string, data: Matrix3D) {

			var uniformBuffer = this.uniforms[name] = this.uniforms[name] || new UniformMatrix4fvRenderData();
			uniformBuffer.name = name;
			uniformBuffer.matrix = data;
		}

		// /**
		//  * 映射常量缓冲
		//  */
		// mapUniformBuffer(name: string, data: Matrix3D) {

		// 	var uniformBuffer = this.uniforms[name] = this.uniforms[name] || new UniformRenderData();
		// 	uniformBuffer.name = name;
		// 	uniformBuffer.matrix = data;
		// }

        /**
         * 处理获取索引缓冲事件
         */
        private onGetIndexBuffer(event: Context3DBufferEvent) {

            var eventData: GetIndexBufferEventData = event.data;
            eventData.buffer = eventData.buffer || this.indexBuffer;
        }

		/**
         * 处理获取属性缓冲事件
         */
        private onGetAttributeBuffer(event: Context3DBufferEvent) {

            var eventData: GetAttributeBufferEventData = event.data;
			eventData.buffer = eventData.buffer || this.attributes[eventData.name];
        }

		/**
         * 处理获取缓冲事件
         */
        private onGetUniformBuffer(event: Context3DBufferEvent) {

            var eventData: GetUniformBufferEventData = event.data;
			eventData.buffer = eventData.buffer || this.uniforms[eventData.name];
        }

		/**
         * 处理获取缓冲事件
         */
        private onGetProgramBuffer(event: Context3DBufferEvent) {

            var eventData: GetProgramBufferEventData = event.data;
            eventData.buffer = eventData.buffer || this.programBuffer;
        }

    }
}