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
                indices.push(i * 2, i * 2 + 1);
                positionData.push(element.start.x, element.start.y, element.start.z, element.end.x, element.end.y, element.end.z);
                colorData.push(element.startColor.r, element.startColor.g, element.startColor.b, element.startColor.a,
                    element.endColor.r, element.endColor.g, element.endColor.b, element.endColor.a);
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
    export class Segment
    {
        start: Vector3;
        end: Vector3;
        startColor: Color4;
        endColor: Color4;

        /**
		 * 创建线段
		 * @param start 起点坐标
		 * @param end 终点坐标
		 * @param colorStart 起点颜色
		 * @param colorEnd 终点颜色
		 * @param thickness 线段厚度
		 */
        constructor(start: Vector3, end: Vector3, colorStart = new Color4(), colorEnd = new Color4())
        {
            this.start = start;
            this.end = end;
            this.startColor = colorStart;
            this.endColor = colorEnd;
        }
    }
}