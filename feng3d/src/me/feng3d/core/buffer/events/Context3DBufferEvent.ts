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

        /**
         * 获取ProgramBuffer
         */
        static GET_PROGRAMBUFFER = "getProgramBuffer";

        /**
         * 获取UniformBuffer
         */
        static GET_UNIFORMBUFFER = "getUniformBuffer";
    }

    /**
     * 获取AttributeBuffer事件数据
     */
    export class GetAttributeBufferEventData {

        /**
         * 属性名称
         */
        name: string;

        /**
         * 属性缓冲
         */
        buffer: AttributeRenderData;
    }

    /**
     * 获取IndexBuffer事件数据
     */
    export class GetIndexBufferEventData {

        /**
         * 索引缓冲
         */
        buffer: IndexRenderData;
    }

    /**
     * 获取ProgramBuffer事件数据
     */
    export class GetProgramBufferEventData {

        /**
         * 渲染程序缓存
         */
        buffer: ProgramBuffer;
    }
    
    /**
     * 获取UniformBuffer事件数据
     */
    export class GetUniformBufferEventData {

        /**
         * 常量名称
         */
        name: string;

        /**
         * 常量缓存
         */
        buffer: UniformRenderData;
    }
}