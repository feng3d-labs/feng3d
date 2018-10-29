namespace feng3d
{

    export interface GeometryMap { PointGeometry: PointGeometry }

    /**
     * 点几何体
     */
    export class PointGeometry extends Geometry
    {

        __class__: "feng3d.PointGeometry" = "feng3d.PointGeometry";

        /**
         * 点数据列表
         * 修改数组内数据时需要手动调用 invalidateGeometry();
         */
        @serialize
        @oav()
        @watch("invalidateGeometry")
        points: PointInfo[] = [];

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

            numPoints = Math.max(1, numPoints);

            for (var i = 0; i < numPoints; i++)
            {
                var element = this.points[i];
                var position = (element && element.position) || Vector3.ZERO;
                var color = (element && element.color) || Color4.WHITE;
                var normal = (element && element.normal) || Vector3.ZERO;
                var uv = (element && element.uv) || Vector2.ZERO;
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
     */
    export interface PointInfo
    {
        position?: Vector3;
        color?: Color4;
        normal?: Vector3;
        uv?: Vector2;
    }

    Feng3dAssets.setAssets(Geometry.point = Object.setValue(new PointGeometry(), { name: "PointGeometry", assetsId: "PointGeometry", points: [], hideFlags: HideFlags.NotEditable }));
}