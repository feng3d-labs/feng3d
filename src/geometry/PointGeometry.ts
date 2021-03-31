namespace feng3d
{

    export interface GeometryTypes { PointGeometry: PointGeometry }

    /**
     * 点几何体
     */
    export class PointGeometry extends Geometry
    {
        __class__: "feng3d.PointGeometry";

        name = "Point";

        @AddEntityMenu("Node3D/Point")
        static create(name = "Point")
        {
            var model = new Entity().addComponent(MeshRenderer);
            model.geometry = new PointGeometry();
            model.name = name;
            model.material = Material.getDefault("Point-Material");
            return model;
        }

        /**
         * 点数据列表
         * 修改数组内数据时需要手动调用 invalidateGeometry();
         */
        @serialize
        @oav({ component: "OAVArray", tooltip: "点数据列表", componentParam: { defaultItem: () => { return new PointInfo(); } } })
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
            var colors: number[] = [];

            numPoints = Math.max(1, numPoints);

            for (var i = 0; i < numPoints; i++)
            {
                var element = this.points[i];
                var position = (element && element.position) || Vector3.ZERO;
                var color = (element && element.color) || Color4.WHITE;
                indices[i] = i;
                positionData.push(position.x, position.y, position.z);
                colors.push(color.r, color.g, color.b, color.a);
            }
            this.positions = positionData;
            this.indices = indices;
            this.colors = colors;
        }
    }

    /**
     * 点信息
     */
    export class PointInfo
    {
        @serialize
        @oav({ tooltip: "坐标" })
        position = new Vector3();

        /**
         * 起点颜色
         */
        @serialize
        @oav({ tooltip: "颜色" })
        color = new Color4();
    }
}