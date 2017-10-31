module feng3d
{

    /**
     * 线段组件
     * @author feng 2016-10-16
     */
    export class SegmentGeometry extends Geometry
    {
        private segments_: Segment[] = [];

        constructor()
        {
            super();
        }

        /**
		 * 添加线段
		 * @param segment		            线段数据
		 */
        addSegment(segment: Segment)
        {
            this.segments_.push(segment);
            this.invalidateGeometry();
        }

        /**
		 * 设置线段
		 * @param segment		            线段数据
		 * @param index		                线段索引
		 */
        setSegmentAt(segment: Segment, index: number)
        {
            this.segments_[index] = segment;
            this.invalidateGeometry();
        }

        /**
         * 更新几何体
         */
        protected buildGeometry()
        {
            var segmentPositionStep = 6;
            var segmentColorStep = 8;
            var numSegments = this.segments_.length;
            var indices: number[] = [];
            var positionData: number[] = [];
            var colorData: number[] = [];

            for (var i = 0; i < numSegments; i++)
            {
                var element = this.segments_[i];
                indices.push(i * 2, i * 2 + 1);
                positionData.push(element.start.x, element.start.y, element.start.z, element.end.x, element.end.y, element.end.z);
                colorData.push(element.startColor.r, element.startColor.g, element.startColor.b, element.startColor.a,
                    element.endColor.r, element.endColor.g, element.endColor.b, element.endColor.a, );
            }

            this.setVAData("a_position", positionData, 3);
            this.setVAData("a_color", colorData, 4);
            this.indices = indices;
        }

        /**
		 * 获取线段数据
		 * @param index 		线段索引
		 * @return				线段数据
		 */
        getSegment(index: number)
        {
            if (index < this.segments_.length)
                return this.segments_[index];
            return null;
        }

		/**
		 * 移除所有线段
		 */
        removeAllSegments()
        {
            this.segments.length = 0;
            this.invalidateGeometry();
        }

		/**
		 * 线段列表
		 */
        get segments()
        {
            return this.segments_;
        }
    }

    /**
     * 线段
     * @author feng 2016-10-16
     */
    export class Segment
    {
        start: Vector3D;
        end: Vector3D;
        startColor: Color;
        endColor: Color;

        /**
		 * 创建线段
		 * @param start 起点坐标
		 * @param end 终点坐标
		 * @param colorStart 起点颜色
		 * @param colorEnd 终点颜色
		 * @param thickness 线段厚度
		 */
        constructor(start: Vector3D, end: Vector3D, colorStart = new Color(), colorEnd = new Color())
        {
            this.start = start;
            this.end = end;
            this.startColor = colorStart;
            this.endColor = colorEnd;
        }
    }
}