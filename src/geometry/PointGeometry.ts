namespace feng3d
{

    /**
     * 点几何体
     * @author feng 2017-01-11
     */
    export class PointGeometry extends Geometry
    {
        /**
         * 点数据列表
         * 修改数组内数据时需要手动调用 invalidateGeometry();
         */
        @serialize
        @oav()
        @watch("invalidateGeometry")
        points: PointInfo[] = [{}];

        /**
         * 构建几何体
         */
        buildGeometry()
        {
            var numPoints = this.points.length;
            var indices: number[] = [];
            var positionData: number[] = [];
            var normalData: number[] = [];
            var uvData: number[] = [];
            var colors: number[] = [];

            for (var i = 0; i < numPoints; i++)
            {
                var element = this.points[i];
                var position = element.position || Vector3.ZERO;
                var color = element.color || Color4.WHITE;
                var normal = element.normal || Vector3.ZERO;
                var uv = element.uv || Vector2.ZERO;
                indices[i] = i;
                positionData.push(position.x, position.y, position.z);
                normalData.push(normal.x, normal.y, normal.z);
                uvData.push(uv.x, uv.y);
                colors.push(color.r, color.g, color.b, color.a);
            }
            this.positions = positionData;
            this.uvs = uvData;
            this.normals = normalData;
            this.indices = indices;
            this.setVAData("a_color", colors, 4)
        }
    }

    /**
     * 点信息
     * @author feng 2016-10-16
     */
    export interface PointInfo
    {
        position?: Vector3;
        color?: Color4;
        normal?: Vector3;
        uv?: Vector2;
    }
}