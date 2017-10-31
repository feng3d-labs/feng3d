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
        addPoint(point: PointInfo, needUpdateGeometry = true)
        {
            this._points.push(point);
            this.geometryDirty = true;
            this.updateGeometry();
        }

        /**
         * 更新几何体
         */
        updateGeometry()
        {
            this.geometryDirty = false;

            var numPoints = this._points.length;
            var indices: number[] = [];
            var positionData: number[] = [];
            var normalData: number[] = [];
            var uvData: number[] = [];
            var colors: number[] = [];

            for (var i = 0; i < numPoints; i++)
            {
                var element = this._points[i];
                indices[i] = i;
                positionData.push(element.position.x, element.position.y, element.position.z);
                normalData.push(element.normal.x, element.normal.y, element.normal.z);
                uvData.push(element.uv.x, element.uv.y);
                colors.push(element.color.r, element.color.g, element.color.b, element.color.a);
            }
            this.positions = positionData;
            this.uvs = uvData;
            this.normals = normalData;
            this.indices = indices;
            this.setVAData("a_color", colors, 4)
        }

        /**
		 * 获取线段数据
		 * @param index 		线段索引
		 * @return				线段数据
		 */
        getPoint(index: number)
        {
            if (index < this._points.length)
                return this._points[index];
            return null;
        }

		/**
		 * 移除所有线段
		 */
        removeAllPoints()
        {
            this.points.length = 0;
            this.geometryDirty = true;
        }

		/**
		 * 线段列表
		 */
        get points(): PointInfo[]
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
        position: Vector3D;
        color: Color;
        normal: Vector3D;
        uv: Point;

        /**
		 * 创建点
		 * @param position 坐标
		 */
        constructor(position = new Vector3D(), color = new Color(), uv = new Point(), normal = new Vector3D(0, 1, 0))
        {
            this.position = position;
            this.color = color;
            this.normal = normal;
            this.uv = uv;
        }
    }
}