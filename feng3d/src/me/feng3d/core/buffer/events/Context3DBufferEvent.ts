module me.feng3d {

    /**
     * Context3D缓冲事件
     * @author feng 2016-05-26
     */
    export class Context3DBufferEvent extends Event {

        /**
         * 获取AttributeBuffer
         */
        static GET_ATTRIBUTEBUFFER = "getAttributeBuffer";

        /**
         * 获取IndexBuffer
         */
        static GET_INDEXBUFFER = "getIndexBuffer";
    }

    /**
     * 获取AttributeBuffer事件数据
     */
    export class GetAttributeBufferEventData {

        /**
         * 程序属性地址
         */
        attribLocation: ProgramAttributeLocation;

        /**
         * 属性缓冲
         */
        attributeBuffer: AttributeBuffer;
    }

    /**
     * 获取IndexBuffer事件数据
     */
    export class GetIndexBufferEventData {

        /**
         * 顶点索引缓冲
         */
        indexBuffer: IndexBuffer;
    }
}