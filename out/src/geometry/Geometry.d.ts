declare namespace feng3d {
    interface GeometryEventMap extends RenderDataHolderEventMap {
        /**
         * 获取几何体顶点数据
         */
        getVAData: any;
        /**
         * 改变几何体顶点数据事件
         */
        changedVAData: any;
        /**
         * 改变顶点索引数据事件
         */
        changedIndexData: any;
        /**
         * 包围盒失效
         */
        boundsInvalid: any;
    }
    interface Geometry {
        once<K extends keyof GeometryEventMap>(type: K, listener: (event: GeometryEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof GeometryEventMap>(type: K, data?: GeometryEventMap[K], bubbles?: boolean): any;
        has<K extends keyof GeometryEventMap>(type: K): boolean;
        on<K extends keyof GeometryEventMap>(type: K, listener: (event: GeometryEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof GeometryEventMap>(type?: K, listener?: (event: GeometryEventMap[K]) => any, thisObject?: any): any;
    }
    /**
     * 几何体
     * @author feng 2016-04-28
     */
    class Geometry extends Feng3dObject {
        /**
         * 顶点索引缓冲
         */
        private _indexBuffer;
        /**
         * 属性数据列表
         */
        private _attributes;
        private _geometryInvalid;
        private _useFaceWeights;
        private _scaleU;
        private _scaleV;
        /**
         * 坐标数据
         */
        positions: Float32Array;
        /**
         * uv数据
         */
        uvs: Float32Array;
        /**
         * 法线数据
         */
        normals: Float32Array;
        /**
         * 切线数据
         */
        tangents: Float32Array;
        /**
         * 创建一个几何体
         */
        constructor();
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext, renderData: RenderAtomic): void;
        /**
         * 几何体变脏
         */
        protected invalidateGeometry(): void;
        /**
         * 更新几何体
         */
        protected updateGrometry(): void;
        /**
         * 构建几何体
         */
        protected buildGeometry(): void;
        /**
         * 索引数据
         */
        readonly indices: Uint16Array;
        /**
         * 更新顶点索引数据
         */
        setIndices(indices: Uint16Array): void;
        /**
         * 获取顶点数据
         */
        getIndexData(): IndexRenderData;
        /**
         * 设置顶点属性数据
         * @param vaId          顶点属性编号
         * @param data          顶点属性数据
         * @param size          顶点数据尺寸
         */
        setVAData<K extends keyof AttributeRenderDataStuct>(vaId: K, data: Float32Array, size: number): void;
        /**
         * 获取顶点属性数据
         * @param vaId 数据类型编号
         * @return 顶点属性数据
         */
        getVAData(vaId: string): AttributeRenderData;
        /**
         * 获取顶点属性数据
         * @param vaId 数据类型编号
         * @return 顶点属性数据
         */
        getVAData1(vaId: string): Float32Array;
        /**
         * 顶点数量
         */
        readonly numVertex: number;
        /**
         * 添加几何体
         * @param geometry          被添加的几何体
         * @param transform         变换矩阵，把克隆被添加几何体的数据变换后再添加到该几何体中
         */
        addGeometry(geometry: Geometry, transform?: Matrix3D): void;
        /**
         * 应用变换矩阵
         * @param transform 变换矩阵
         */
        applyTransformation(transform: Matrix3D): void;
        /**
         * 纹理U缩放，默认为1。
         */
        readonly scaleU: number;
        /**
         * 纹理V缩放，默认为1。
         */
        readonly scaleV: number;
        /**
         * 缩放UV
         * @param scaleU 纹理U缩放，默认1。
         * @param scaleV 纹理V缩放，默认1。
         */
        scaleUV(scaleU?: number, scaleV?: number): void;
        /**
         * 包围盒失效
         */
        invalidateBounds(): void;
        /**
         * 创建顶点法线
         */
        createVertexNormals(): void;
        /**
         * 创建顶点切线
         */
        createVertexTangents(): void;
        /**
         * 克隆一个几何体
         */
        clone(): Geometry;
        /**
         * 从一个几何体中克隆数据
         */
        cloneFrom(geometry: Geometry): void;
    }
}
