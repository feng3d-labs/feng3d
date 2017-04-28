module feng3d
{
	/**
	 * 属性渲染数据
	 * @author feng 2014-8-14
	 */
    export class AttributeRenderData
    {
        /**
         * 属性数据
         */
        public get data() { return this._data; }
        public set data(value) { this.invalidate(); this._data = value; }
        private _data: Float32Array;

        /**
         * 数据步长
         */
        public get stride() { return this._stride; }
        public set stride(value) { this.invalidate(); this._stride = value; }
        private _stride = 3;

        /**
         * drawElementsInstanced时将会用到的因子，表示divisor个geometry共用一个数据
         */
        public get divisor() { return this._divisor; }
        public set divisor(value) { this.invalidate(); this._divisor = value; }
        public _divisor = 0;

        /**
         * 顶点数据缓冲
         */
        private _indexBufferMap = new Map<GL, WebGLBuffer>();
        /**
         * 是否失效
         */
        private _invalid = true;

        constructor(data: Float32Array = null, stride: number = 3, divisor: number = 0)
        {
            this._data = data;
            this._stride = stride;
            this._divisor = divisor;
            this._invalid = true;
        }

        /**
         * 使数据缓冲失效
         */
        public invalidate()
        {
            this._invalid = true;
        }

        public active(gl: GL, location: number)
        {
            if (this._invalid)
            {
                this.clear();
                this._invalid = false;
            }
            gl.enableVertexAttribArray(location);
            var buffer = this.getBuffer(gl);
            gl.bindBuffer(GL.ARRAY_BUFFER, buffer);
            gl.vertexAttribPointer(location, this.stride, GL.FLOAT, false, 0, 0);
        }

        /**
         * 获取缓冲
         */
        private getBuffer(gl: GL)
        {
            var buffer = this._indexBufferMap.get(gl);
            if (!buffer)
            {
                buffer = gl.createBuffer();
                gl.bindBuffer(GL.ARRAY_BUFFER, buffer);
                gl.bufferData(GL.ARRAY_BUFFER, this.data, GL.STATIC_DRAW);
                this._indexBufferMap.push(gl, buffer);
            }
            return buffer;
        }

        /**
         * 清理缓冲
         */
        private clear()
        {
            var gls = this._indexBufferMap.getKeys();
            for (var i = 0; i < gls.length; i++)
            {
                gls[i].deleteBuffer(this._indexBufferMap.get(gls[i]))
            }
            this._indexBufferMap.clear();
        }

        /**
         * 克隆
         */
        public clone()
        {
            var cls = <any>this.constructor;
            var ins: this = new cls();
            ins.data = new Float32Array(this.data.length);
            ins.data.set(this.data, 0);
            ins.stride = this.stride;
            ins.divisor = this.divisor;
            return ins;
        }
    }
}