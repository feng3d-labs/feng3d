module me.feng3d {

    /**
	 * Context3D数据缓冲
	 * @author feng 2016-6-7
	 */
    export class Context3DBuffer extends Component {

		/**
		 * 属性缓冲字典
		 */
		private attributeBufferDic: { [key: string]: AttributeBuffer } = {};

		/**
		 * 创建Context3D数据缓冲
		 */
        constructor() {

			super();
        }

		/**
		 * 映射索引缓冲
		 */
		mapIndexBuffer(value: Uint16Array) {
			var indexBuffer = this.getOrCreateComponentByClass(IndexBuffer);
			indexBuffer.indices = value;
		}

		/**
		 * 映射属性缓冲
		 * @param attributeName		属性名称
		 * @param data				数据
		 * @param size				单个属性数据长度
		 */
		mapAttributeBuffer(attributeName: string, data: Float32Array, size: number) {

			var attributeBuffer = this.getAttributeBuffer(attributeName);
			if (!attributeBuffer) {
				attributeBuffer = new AttributeBuffer();
				attributeBuffer.name = attributeName;
				this.addAttributeBuffer(attributeBuffer);
			}
			attributeBuffer.data = data;
			attributeBuffer.size = size;
		}

		/**
		 * 获取属性缓冲
		 * @param attributeName		属性名称
		 */
		getAttributeBuffer(attributeName: string) {

			return this.attributeBufferDic[attributeName];
		}

		/**
		 * 添加属性缓冲
		 * @param attributeBuffer		属性缓冲
		 */
		addAttributeBuffer(attributeBuffer: AttributeBuffer) {

			this.attributeBufferDic[attributeBuffer.name] = attributeBuffer;
			this.addComponent(attributeBuffer);
		}

		/**
		 * 删除属性缓冲
		 * @param attributeBuffer		属性缓冲
		 */
		deleteAttributeBuffer(attributeBuffer: AttributeBuffer) {

			delete this.attributeBufferDic[attributeBuffer.name];
			this.removeComponent(attributeBuffer);
		}
    }
}