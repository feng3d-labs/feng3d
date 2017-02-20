module feng3d
{

    /**
     * 加载数据类型
     * @author feng 2016-12-14
     */
    export class LoaderDataFormat
    {

        /**
         * 以原始二进制数据形式接收下载的数据。
         */
        public static BINARY = "binary";
        /**
         * 以文本形式接收已下载的数据。
         */
        public static TEXT = "text";
        /**
         * 图片数据
         */
        public static IMAGE = "image";
    }
}