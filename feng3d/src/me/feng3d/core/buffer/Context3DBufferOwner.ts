module me.feng3d {

    /**
	 * Context3D缓存拥有者
	 * @author feng 2014-11-26
	 */
    export class Context3DBufferOwner extends Component {
        private indexBuffer: IndexBuffer;
        private _bufferDic;
        private _bufferList: Context3DBuffer[];
		/**
		 * 缓冲拥有者子项列表
		 */
        private childrenBufferOwner: Context3DBufferOwner[];

        private allBufferList: Context3DBuffer[];
		/**
		 * 所有缓冲列表是否有效
		 */
        private bufferInvalid: boolean = true;

		/**
		 * 创建Context3D缓存拥有者
		 */
        constructor() {
            super();
            this.childrenBufferOwner = [];
            this.initBuffers();
        }

        /**
         * 映射顶点索引缓冲
         */
        mapIndexBuffer(indices: Uint16Array) {

            this.indexBuffer = { indices: indices };
        }

		/**
		 * @inheritDoc
		 */
        public get bufferDic() {
            if (this._bufferDic == null)
                this._bufferDic = {};
            return this._bufferDic;
        }

		/**
		 * @inheritDoc
		 */
        public get bufferList(): Context3DBuffer[] {
            if (this._bufferList == null)
                this._bufferList = [];
            return this._bufferList;
        }

		/**
		 * 初始化Context3d缓存
		 */
        protected initBuffers() {

        }

		/**
		 * 添加子项缓存拥有者
		 * @param childBufferOwner
		 */
        public addChildBufferOwner(childBufferOwner: Context3DBufferOwner) {
            var index: number = this.childrenBufferOwner.indexOf(childBufferOwner);
            assert(index == -1, "不能重复添加子项缓存拥有者");
            this.childrenBufferOwner.push(childBufferOwner);
            //添加事件
            childBufferOwner.addEventListener(Context3DBufferOwnerEvent.ADD_CONTEXT3DBUFFER, this.bubbleDispatchEvent, this);
            childBufferOwner.addEventListener(Context3DBufferOwnerEvent.REMOVE_CONTEXT3DBUFFER, this.bubbleDispatchEvent, this);
            childBufferOwner.addEventListener(Context3DBufferOwnerEvent.ADDCHILD_CONTEXT3DBUFFEROWNER, this.bubbleDispatchEvent, this);
            childBufferOwner.addEventListener(Context3DBufferOwnerEvent.REMOVECHILD_CONTEXT3DBUFFEROWNER, this.bubbleDispatchEvent, this);
            //派发添加子项缓冲拥有者事件
            this.dispatchEvent(new Context3DBufferOwnerEvent(Context3DBufferOwnerEvent.ADDCHILD_CONTEXT3DBUFFEROWNER, childBufferOwner));
        }

		/**
		 * 移除子项缓存拥有者
		 * @param childBufferOwner
		 */
        public removeChildBufferOwner(childBufferOwner: Context3DBufferOwner) {
            var index: number = this.childrenBufferOwner.indexOf(childBufferOwner);
            assert(index != -1, "无法移除不存在的子项缓存拥有者");
            this.childrenBufferOwner.splice(index, 1);
            //移除事件
            childBufferOwner.removeEventListener(Context3DBufferOwnerEvent.ADD_CONTEXT3DBUFFER, this.bubbleDispatchEvent, this);
            childBufferOwner.removeEventListener(Context3DBufferOwnerEvent.REMOVE_CONTEXT3DBUFFER, this.bubbleDispatchEvent, this);
            childBufferOwner.removeEventListener(Context3DBufferOwnerEvent.ADDCHILD_CONTEXT3DBUFFEROWNER, this.bubbleDispatchEvent, this);
            childBufferOwner.removeEventListener(Context3DBufferOwnerEvent.REMOVECHILD_CONTEXT3DBUFFEROWNER, this.bubbleDispatchEvent, this);
            //派发添加子项缓冲拥有者事件
            this.dispatchEvent(new Context3DBufferOwnerEvent(Context3DBufferOwnerEvent.REMOVECHILD_CONTEXT3DBUFFEROWNER, childBufferOwner));
        }

		/**
		 * 向上冒泡
		 */
        private bubbleDispatchEvent(event: Context3DBufferOwnerEvent) {
            this.bufferInvalid = true;
            this.dispatchEvent(event);
        }

		/**
		 * 标记Context3d缓存脏了
		 * @param dataTypeId
		 */
        public markBufferDirty(dataTypeId: string) {
            var context3DBuffer: Context3DBuffer = this.bufferDic[dataTypeId];
            // context3DBuffer.invalid();
        }

		/**
		 * @inheritDoc
		 */
        public mapContext3DBuffer(dataTypeId: string, updateFunc: Function): Context3DBuffer {
            var bufferCls: any = context3DBufferTypeManager.getBufferClass(dataTypeId);

            var context3DBuffer: Context3DBuffer = new bufferCls(dataTypeId, updateFunc);
            this.bufferDic[dataTypeId] = context3DBuffer;
            this.bufferList.push(context3DBuffer);

            this.dispatchEvent(new Context3DBufferOwnerEvent(Context3DBufferOwnerEvent.ADD_CONTEXT3DBUFFER, context3DBuffer));
            return context3DBuffer;
        }

		/**
		 * @inheritDoc
		 */
        public getAllBufferList(): Context3DBuffer[] {
            if (this.bufferInvalid) {
                //收集本拥有者缓冲列表
                this.allBufferList = this.bufferList.concat();

                var childAllBufferList: Context3DBuffer[];
                //遍历子项拥有者收集缓冲列表
                for (var i: number = 0; i < this.childrenBufferOwner.length; i++) {
                    childAllBufferList = this.childrenBufferOwner[i].getAllBufferList();
                    this.allBufferList = this.allBufferList.concat(childAllBufferList);
                }
                this.bufferInvalid = false;
            }

            return this.allBufferList;
        }
    }
}