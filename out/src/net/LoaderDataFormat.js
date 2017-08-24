var feng3d;
(function (feng3d) {
    /**
     * 加载数据类型
     * @author feng 2016-12-14
     */
    var LoaderDataFormat = (function () {
        function LoaderDataFormat() {
        }
        return LoaderDataFormat;
    }());
    /**
     * 以原始二进制数据形式接收下载的数据。
     */
    LoaderDataFormat.BINARY = "binary";
    /**
     * 以文本形式接收已下载的数据。
     */
    LoaderDataFormat.TEXT = "text";
    /**
     * 图片数据
     */
    LoaderDataFormat.IMAGE = "image";
    feng3d.LoaderDataFormat = LoaderDataFormat;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=LoaderDataFormat.js.map