module me.feng3d {

    /**
	 * Context3D数据缓冲
	 * @author feng 2016-6-7
	 */
    export class Context3DBuffer extends Component {

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
		 */
		mapAttributeBuffer(value: Uint16Array) {
			var attributeBuffer = this.getOrCreateComponentByClass(AttributeBuffer);
			attributeBuffer.data = value;
		}
    }
}