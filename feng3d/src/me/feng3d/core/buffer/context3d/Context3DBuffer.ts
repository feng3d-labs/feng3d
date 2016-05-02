module me.feng3d {

    /**
	 * Context3D可执行的数据缓存
	 * @author feng 2014-6-9
	 */
    export abstract class Context3DBuffer {

        /** 3d缓存类型编号 */
        private _dataTypeId: string;

        /** 数据脏了 */
        protected _dataDirty: boolean = true;

        /** 更新回调函数 */
        protected _updateFunc: Function;

		/**
		 * 创建一个gl可执行的数据缓存
		 * @param dataTypeId 		数据缓存编号
		 * @param updateFunc 		更新回调函数
		 */
        constructor(dataTypeId: string, updateFunc: Function) {

            this._dataTypeId = dataTypeId;
            this._updateFunc = updateFunc;
        }

        /**
		 * 使缓存无效
		 */
        public invalid() {
            this._dataDirty = true;
        }

        /**
		 * 运行更新回调函数
		 */
        protected doUpdateFunc() {
            if (this._updateFunc != null && this._dataDirty) {
                this._updateFunc(this);
                this._dataDirty = false;
            }
        }

		/**
		 * 缓存类型编号
		 */
        public get dataTypeId(): string {
            return this._dataTypeId;
        }

        /**
		 * 执行Context3DBuffer
		 * <p><b>注：</b>该函数为虚函数</p>
		 *
		 * @param context3D		3d环境
		 *
		 * @see me.feng3d.core.buffer.Context3DCache
		 */
        public abstract doBuffer(context3D: WebGLRenderingContext);

		/**
		 * 字符串描述
		 */
        public toString(): string {
            return `[${getClassName(this)} dataType="${this._dataTypeId}"]`;
        }
    }
}