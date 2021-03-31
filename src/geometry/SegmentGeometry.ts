namespace feng3d
{
    export interface GeometryTypes { SegmentGeometry: SegmentGeometry }

    /**
     * 线段组件
     */
    export class SegmentGeometry extends Geometry
    {

        __class__: "feng3d.SegmentGeometry";

        name = "Segment";

        @AddEntityMenu("Node3D/Segment")
        static create(name = "Segment")
        {
            var model = new Entity().addComponent(MeshRenderer);
            model.geometry = new SegmentGeometry();
            model.name = name;
            model.material = Material.getDefault("Segment-Material");
            return model;
        }

		/**
		 * 线段列表
         * 修改数组内数据时需要手动调用 invalidateGeometry();
		 */
        @serialize
        @oav({ component: "OAVArray", tooltip: "线段列表", componentParam: { defaultItem: () => { return new Segment(); } } })
        @watch("invalidateGeometry")
        segments: Segment[] = [];

        /**
         * 添加线段
         * 
         * @param segment 线段
         */
        addSegment(segment: Partial<Segment>)
        {
            var s = new Segment();
            serialization.setValue(s, segment);
            this.segments.push(s);
            this.invalidateGeometry();
        }

        constructor()
        {
            super();
        }

        /**
         * 更新几何体
         */
        protected buildGeometry()
        {
            var numSegments = this.segments.length;
            var indices: number[] = [];
            var positionData: number[] = [];
            var colorData: number[] = [];

            for (var i = 0; i < numSegments; i++)
            {
                var element = this.segments[i];
                var start = element.start || Vector3.ZERO;
                var end = element.end || Vector3.ZERO;;
                var startColor = element.startColor || Color4.WHITE;
                var endColor = element.endColor || Color4.WHITE;

                indices.push(i * 2, i * 2 + 1);
                positionData.push(start.x, start.y, start.z, end.x, end.y, end.z);
                colorData.push(startColor.r, startColor.g, startColor.b, startColor.a,
                    endColor.r, endColor.g, endColor.b, endColor.a);
            }

            this.positions = positionData;
            this.colors = colorData;
            this.indices = indices;
        }
    }

    /**
     * 线段
     */
    export class Segment
    {
        /**
         * 起点坐标
         */
        @serialize
        @oav({ tooltip: "起点坐标" })
        start = new Vector3();

        /**
         * 终点坐标
         */
        @serialize
        @oav({ tooltip: "终点坐标" })
        end = new Vector3();

        /**
         * 起点颜色
         */
        @serialize
        @oav({ tooltip: "起点颜色" })
        startColor = new Color4();

        /**
         * 终点颜色
         */
        @serialize
        @oav({ tooltip: "终点颜色" })
        endColor = new Color4();
    }

    Entity.registerPrimitive("Segment", (g) =>
    {
        var model = g.addComponent(MeshRenderer);
        model.geometry = new SegmentGeometry();
        model.material = Material.getDefault("Segment-Material");
    });

    export interface PrimitiveEntity
    {
        Segment: Entity;
    }
}