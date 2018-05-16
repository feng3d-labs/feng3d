namespace feng3d
{
    export interface SegmentGeometryRaw
    {
        __class__: "feng3d.SegmentGeometry"
    }

    /**
     * 线段组件
     * @author feng 2016-10-16
     */
    export class SegmentGeometry extends Geometry
    {
		/**
		 * 线段列表
         * 修改数组内数据时需要手动调用 invalidateGeometry();
		 */
        @serialize
        @oav()
        @watch("invalidateGeometry")
        segments: Segment[] = [];

        constructor()
        {
            super();
        }

        /**
         * 更新几何体
         */
        protected buildGeometry()
        {
            var segmentPositionStep = 6;
            var segmentColorStep = 8;
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

            this.setVAData("a_position", positionData, 3);
            this.setVAData("a_color", colorData, 4);
            this.indices = indices;
        }
    }

    /**
     * 线段
     * @author feng 2016-10-16
     */
    export interface Segment
    {
        /**
         * 起点坐标
         */
        start?: Vector3;
        /**
         * 终点坐标
         */
        end?: Vector3;
        /**
         * 起点颜色
         */
        startColor?: Color4;
        /**
         * 线段厚度
         */
        endColor?: Color4;
    }
}