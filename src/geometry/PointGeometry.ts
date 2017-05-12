module feng3d
{

    /**
     * 点几何体
     * @author feng 2017-01-11
     */
    export class PointGeometry extends Geometry
    {
        /**
         * 几何体是否变脏
         */
        private geometryDirty = false;
        private _points: PointInfo[] = [];

        constructor()
        {
            super();
            this.addPoint(new PointInfo(new Vector3D(0, 0, 0)))
        }

        /**
		 * 添加点
		 * @param point		点数据
		 */
        public addPoint(point: PointInfo, needUpdateGeometry: boolean = true)
        {
            this._points.push(point);
            this.geometryDirty = true;
            this.updateGeometry();
        }

        /**
         * 更新几何体
         */
        public updateGeometry()
        {
            this.geometryDirty = false;

            var positionStep = 3;
            var normalStep = 3;
            var uvStep = 2;
            var numPoints = this._points.length;
            var indices = new Uint16Array(numPoints);
            var positionData = new Float32Array(numPoints * positionStep);
            var normalData = new Float32Array(numPoints * normalStep);
            var uvData = new Float32Array(numPoints * uvStep);

            for (var i = 0; i < numPoints; i++)
            {
                var element = this._points[i];
                indices[i] = i;
                positionData.set(element.position.toArray(3), i * positionStep);
                normalData.set(element.normal.toArray(3), i * normalStep);
                uvData.set(element.uv.toArray(), i * uvStep);
            }
            this.positions = positionData;
            this.uvs = uvData;
            this.normals = normalData;
            this.setIndices(indices);
        }

        /**
		 * 获取线段数据
		 * @param index 		线段索引
		 * @return				线段数据
		 */
        public getPoint(index: number): PointInfo
        {
            if (index < this._points.length)
                return this._points[index];
            return null;
        }

		/**
		 * 移除所有线段
		 */
        public removeAllPoints()
        {
            this.points.length = 0;
            this.geometryDirty = true;
        }

		/**
		 * 线段列表
		 */
        public get points(): PointInfo[]
        {
            return this._points;
        }
    }

    /**
     * 点信息
     * @author feng 2016-10-16
     */
    export class PointInfo
    {
        public position: Vector3D;
        public normal: Vector3D;
        public uv: Point;

        /**
		 * 创建点
		 * @param position 坐标
		 */
        constructor(position = new Vector3D(), uv = new Point(), normal = new Vector3D(0, 1, 0))
        {
            this.position = position;
            this.normal = normal;
            this.uv = uv;
        }
    }
}