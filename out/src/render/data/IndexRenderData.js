var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var feng3d;
(function (feng3d) {
    /**
     * 索引渲染数据
     * @author feng 2017-01-04
     */
    var IndexRenderData = (function (_super) {
        __extends(IndexRenderData, _super);
        function IndexRenderData() {
            var _this = _super.call(this) || this;
            /**
             * 数据类型，gl.UNSIGNED_BYTE、gl.UNSIGNED_SHORT
             */
            _this.type = feng3d.GL.UNSIGNED_SHORT;
            /**
             * 索引偏移
             */
            _this.offset = 0;
            /**
             * 缓冲
             */
            _this._indexBufferMap = new feng3d.Map();
            /**
             * 是否失效
             */
            _this._invalid = true;
            return _this;
        }
        Object.defineProperty(IndexRenderData.prototype, "indices", {
            /**
             * 索引数据
             */
            get: function () {
                return this._indices;
            },
            set: function (value) {
                if (this._indices == value)
                    return;
                this._indices = value;
                this._invalid = true;
                this.count = this.indices ? this.indices.length : 0;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 激活缓冲
         * @param gl
         */
        IndexRenderData.prototype.active = function (gl) {
            if (this._invalid) {
                this.clear();
                this._invalid = false;
            }
            var buffer = this.getBuffer(gl);
            gl.bindBuffer(feng3d.GL.ELEMENT_ARRAY_BUFFER, buffer);
        };
        /**
         * 获取缓冲
         */
        IndexRenderData.prototype.getBuffer = function (gl) {
            var buffer = this._indexBufferMap.get(gl);
            if (!buffer) {
                buffer = gl.createBuffer();
                gl.bindBuffer(feng3d.GL.ELEMENT_ARRAY_BUFFER, buffer);
                gl.bufferData(feng3d.GL.ELEMENT_ARRAY_BUFFER, this.indices, feng3d.GL.STATIC_DRAW);
                this._indexBufferMap.push(gl, buffer);
            }
            return buffer;
        };
        /**
         * 清理缓冲
         */
        IndexRenderData.prototype.clear = function () {
            var gls = this._indexBufferMap.getKeys();
            for (var i = 0; i < gls.length; i++) {
                gls[i].deleteBuffer(this._indexBufferMap.get(gls[i]));
            }
            this._indexBufferMap.clear();
        };
        /**
         * 克隆
         */
        IndexRenderData.prototype.clone = function () {
            var cls = this.constructor;
            var ins = new cls();
            var indices = new Uint16Array(this.indices.length);
            indices.set(this.indices, 0);
            ins.indices = indices;
            ins.count = this.count;
            ins.type = this.type;
            ins.offset = this.offset;
            return ins;
        };
        return IndexRenderData;
    }(feng3d.RenderElement));
    feng3d.IndexRenderData = IndexRenderData;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=IndexRenderData.js.map