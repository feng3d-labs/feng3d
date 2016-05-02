module me.feng3d {

    /**
     * 几何体
     * @author feng 2016-04-28
     */
    export class Geometry extends Component {

        private _vaIdList: string[] = [];
        /** 顶点属性数据步长字典 */
        private strideDic = {};
        /** 顶点属性数据字典 */
        private vaDataDic = {};

        private _indices: number[];

        /**
		 * 索引数据
		 */
        public get indices(): number[] {

            return this._indices;
        }

		/**
		 * 更新顶点索引数据
		 */
        public set indices(value: number[]) {

            this._indices = value;
            this.dispatchEvent(new GeometryEvent(GeometryEvent.CHANGED_INDEX_DATA));
        }

		/**
		 * 获取顶点属性步长(1-4)
		 * @param vaId          顶点属性编号
		 * @return 顶点属性步长
		 */
        public getVAStride(vaId: string): number {

            return this.strideDic[vaId];
        }

		/**
		 * 设置顶点属性数据
		 * @param vaId          顶点属性编号
		 * @param data          顶点属性数据
         * @param stride        顶点数据步长
		 */
        public setVAData(vaId: string, data: Float32Array, stride: number) {

            var vaLen: number = this.getVAStride(vaId);
            this.vaDataDic[vaId] = data;
            this.dispatchEvent(new GeometryEvent(GeometryEvent.CHANGED_VA_DATA, vaId));
        }

		/**
		 * 获取顶点属性数据
		 * @param vaId 数据类型编号
		 * @return 顶点属性数据
		 */
        public getVAData(vaId: string): Float32Array {

            this.dispatchEvent(new GeometryEvent(GeometryEvent.GET_VA_DATA, vaId));
            return this.vaDataDic[vaId];
        }

        /**
         * 顶点属性编号列表
         */
        public get vaIdList(): string[] {

            return this._vaIdList;
        }
    }
}