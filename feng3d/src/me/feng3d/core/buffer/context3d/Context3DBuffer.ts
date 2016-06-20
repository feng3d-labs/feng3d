module me.feng3d {

    /**
	 * Context3D数据缓冲
	 * @author feng 2016-6-7
	 */
    export class Context3DBuffer extends Component {

		private indexBuffer: IndexBuffer;
		private programBuffer: ProgramBuffer;
		private attributes: { [name: string]: AttributeBuffer } = {};
		private uniforms: { [name: string]: UniformBuffer } = {};

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
			var indexBuffer = this.indexBuffer = this.indexBuffer || new IndexBuffer();
			indexBuffer.indices = value;
		}

		/**
		 * 映射属性缓冲
		 */
		mapAttributeBuffer(name: string, value: Uint16Array, stride: number) {

			var attributeBuffer = this.attributes[name] = this.attributes[name] || new AttributeBuffer();
			attributeBuffer.name = name;
			attributeBuffer.data = value;
			attributeBuffer.size = stride;
		}

		/**
		 * 映射程序缓冲
         * @param vertexCode        顶点渲染程序代码
         * @param fragmentCode      片段渲染程序代码
         */
        mapProgramBuffer(vertexCode: string, fragmentCode: string) {

			var programBuffer = this.programBuffer = this.programBuffer || new ProgramBuffer();
			programBuffer.vertexCode = vertexCode;
			programBuffer.fragmentCode = fragmentCode;
		}

		/**
		 * 映射常量缓冲
		 */
		mapUniformBuffer(name: string, data: Matrix3D) {

			var uniformBuffer = this.uniforms[name] = this.uniforms[name] || new UniformBuffer();
			uniformBuffer.name = name;
			uniformBuffer.matrix = data;
		}

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

	/**
	 * 索引缓冲
	 */
    export class IndexBuffer {

        /**
         * 索引数据
         */
        indices: Uint16Array;
    }

	/**
	 * 属性缓冲
	 * @author feng 2014-8-14
	 */
    export class AttributeBuffer {

        /**
         * 属性缓冲名称
         */
        name: string;

        /** 顶点数据 */
        data: Float32Array;

        /** 与每个顶点关联的 32 位（4 字节）数据值的数量。 */
        size: number;
    }

	/**
     * 常量缓冲
     */
    export class UniformBuffer {

        /**
         * 常量缓冲名称
         */
        name: string;

		/**
		 * 矩阵数据
		 */
        matrix: Matrix3D;
    }
}