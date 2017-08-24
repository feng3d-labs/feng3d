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
     * 属性渲染数据
     * @author feng 2014-8-14
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer}
     */
    var AttributeRenderData = (function (_super) {
        __extends(AttributeRenderData, _super);
        function AttributeRenderData(name, data, size, divisor) {
            if (data === void 0) { data = null; }
            if (size === void 0) { size = 3; }
            if (divisor === void 0) { divisor = 0; }
            var _this = _super.call(this) || this;
            _this._size = 3;
            /**
             *  A GLenum specifying the data type of each component in the array. Possible values:
                    - gl.BYTE: signed 8-bit integer, with values in [-128, 127]
                    - gl.SHORT: signed 16-bit integer, with values in [-32768, 32767]
                    - gl.UNSIGNED_BYTE: unsigned 8-bit integer, with values in [0, 255]
                    - gl.UNSIGNED_SHORT: unsigned 16-bit integer, with values in [0, 65535]
                    - gl.FLOAT: 32-bit floating point number
                When using a WebGL 2 context, the following values are available additionally:
                   - gl.HALF_FLOAT: 16-bit floating point number
             */
            _this.type = feng3d.GL.FLOAT;
            /**
             * A GLboolean specifying whether integer data values should be normalized when being casted to a float.
                  -  If true, signed integers are normalized to [-1, 1].
                  -  If true, unsigned integers are normalized to [0, 1].
                  -  For types gl.FLOAT and gl.HALF_FLOAT, this parameter has no effect.
             */
            _this.normalized = false;
            /**
             * A GLsizei specifying the offset in bytes between the beginning of consecutive vertex attributes. Cannot be larger than 255.
             */
            _this.stride = 0;
            /**
             * A GLintptr specifying an offset in bytes of the first component in the vertex attribute array. Must be a multiple of type.
             */
            _this.offset = 0;
            _this._divisor = 0;
            /**
             * 顶点数据缓冲
             */
            _this._indexBufferMap = new feng3d.Map();
            /**
             * 是否失效
             */
            _this._invalid = true;
            _this.name = name;
            _this._data = data;
            _this._size = size;
            _this._divisor = divisor;
            _this._invalid = true;
            return _this;
        }
        Object.defineProperty(AttributeRenderData.prototype, "data", {
            /**
             * 属性数据
             */
            get: function () { return this._data; },
            set: function (value) { this.invalidate(); this._data = value; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AttributeRenderData.prototype, "size", {
            /**
             * 数据尺寸
             *
             * A GLint specifying the number of components per vertex attribute. Must be 1, 2, 3, or 4.
             */
            get: function () { return this._size; },
            set: function (value) { this.invalidate(); this._size = value; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AttributeRenderData.prototype, "divisor", {
            /**
             * drawElementsInstanced时将会用到的因子，表示divisor个geometry共用一个数据
             *
             * A GLuint specifying the number of instances that will pass between updates of the generic attribute.
             * @see https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/vertexAttribDivisorANGLE
             */
            get: function () { return this._divisor; },
            set: function (value) { this.invalidate(); this._divisor = value; },
            enumerable: true,
            configurable: true
        });
        /**
         * 使数据缓冲失效
         */
        AttributeRenderData.prototype.invalidate = function () {
            this._invalid = true;
        };
        /**
         *
         * @param gl
         * @param location A GLuint specifying the index of the vertex attribute that is to be modified.
         */
        AttributeRenderData.prototype.active = function (gl, location) {
            if (this.updateGrometry)
                this.updateGrometry();
            if (this._invalid) {
                this.clear();
                this._invalid = false;
            }
            gl.enableVertexAttribArray(location);
            var buffer = this.getBuffer(gl);
            gl.bindBuffer(feng3d.GL.ARRAY_BUFFER, buffer);
            gl.vertexAttribPointer(location, this.size, this.type, this.normalized, this.stride, this.offset);
            if (this.divisor > 0) {
                gl.vertexAttribDivisor(location, this.divisor);
            }
        };
        /**
         * 获取缓冲
         */
        AttributeRenderData.prototype.getBuffer = function (gl) {
            var buffer = this._indexBufferMap.get(gl);
            if (!buffer) {
                buffer = gl.createBuffer();
                buffer.uuid = Math.generateUUID();
                gl.bindBuffer(feng3d.GL.ARRAY_BUFFER, buffer);
                gl.bufferData(feng3d.GL.ARRAY_BUFFER, this.data, feng3d.GL.STATIC_DRAW);
                this._indexBufferMap.push(gl, buffer);
            }
            return buffer;
        };
        /**
         * 清理缓冲
         */
        AttributeRenderData.prototype.clear = function () {
            var gls = this._indexBufferMap.getKeys();
            for (var i = 0; i < gls.length; i++) {
                gls[i].deleteBuffer(this._indexBufferMap.get(gls[i]));
            }
            this._indexBufferMap.clear();
        };
        /**
         * 克隆
         */
        AttributeRenderData.prototype.clone = function () {
            var cls = this.constructor;
            var ins = new cls();
            ins.name = this.name;
            ins.data = new Float32Array(this.data.length);
            ins.data.set(this.data, 0);
            ins.size = this.size;
            ins.divisor = this.divisor;
            return ins;
        };
        return AttributeRenderData;
    }(feng3d.RenderElement));
    feng3d.AttributeRenderData = AttributeRenderData;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=AttributeRenderData.js.map