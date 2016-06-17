module me.feng3d {

    /**
	 * Context3D数据缓冲
	 * @author feng 2016-6-7
	 */
    export class Context3DBuffer extends Component {

		private attributes: { [name: string]: AttributeBuffer } = {};
		private uniforms: { [name: string]: UniformBuffer } = {};

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
		mapAttributeBuffer(name: string, value: Uint16Array, stride: number) {
			var attributeBuffer = this.getAttributeBuffer(name);
			attributeBuffer.data = value;
			attributeBuffer.size = stride;
		}

		/**
		 * 获取属性缓冲
		 * @param name	属性名称
		 */
		private getAttributeBuffer(name: string) {

			var attributeBuffer = this.attributes[name];
			if (!attributeBuffer) {
				attributeBuffer = this.attributes[name] = new AttributeBuffer();
				attributeBuffer.name = name;
				this.addComponent(attributeBuffer);
			}
			return attributeBuffer;
		}

		/**
		 * 映射程序缓冲
         * @param vertexCode        顶点渲染程序代码
         * @param fragmentCode      片段渲染程序代码
         */
        mapProgramBuffer(vertexCode: string, fragmentCode: string) {

			var programBuffer = this.getOrCreateComponentByClass(ProgramBuffer);
			programBuffer.vertexCode = vertexCode;
			programBuffer.fragmentCode = fragmentCode;
		}

		/**
		 * 映射常量缓冲
		 */
		mapUniformBuffer(name: string, data: Matrix3D) {

			var uniformBuffer = this.getUniformBuffer(name);
			uniformBuffer.matrix = data;
		}

		/**
		 * 获取常量缓冲
		 * @param name	属性名称
		 */
		private getUniformBuffer(name: string) {

			var uniformBuffer = this.uniforms[name];
			if (!uniformBuffer) {
				uniformBuffer = this.uniforms[name] = new UniformBuffer();
				uniformBuffer.name = name;
				this.addComponent(uniformBuffer);
			}
			return uniformBuffer;
		}
    }
}