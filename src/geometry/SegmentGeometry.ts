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
            this._type = Geometry;
        }

        /**
		 * 添加线段
		 * @param segment		            线段数据
		 */
        public addSegment(segment: Segment)
        {
            this.segments_.push(segment);
            this.invalidateGeometry();
        }

        /**
		 * 设置线段
		 * @param segment		            线段数据
		 * @param index		                线段索引
		 */
        public setSegmentAt(segment: Segment, index: number)
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
            var indices = new Uint16Array(numSegments * 2);
            var positionData = new Float32Array(numSegments * segmentPositionStep);
            var colorData = new Float32Array(numSegments * segmentColorStep);

            for (var i = 0; i < numSegments; i++)
            {
                var element = this.segments_[i];
                indices.set([i * 2, i * 2 + 1], i * 2);
                positionData.set(element.positionData, i * segmentPositionStep);
                colorData.set(element.colorData, i * segmentColorStep);
            }

            this.setVAData(GLAttribute.a_position, positionData, 3);
            this.setVAData(GLAttribute.a_color, colorData, 4);
            this.setIndices(indices);
        }

        /**
		 * 获取线段数据
		 * @param index 		线段索引
		 * @return				线段数据
		 */
        public getSegment(index: number): Segment
        {
            if (index < this.segments_.length)
                return this.segments_[index];
            return null;
        }

		/**
		 * 移除所有线段
		 */
        public removeAllSegments()
        {
            this.segments.length = 0;
            this.invalidateGeometry();
        }

		/**
		 * 线段列表
		 */
        public get segments(): Segment[]
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
        public thickness: number;
        public start: Vector3D;
        public end: Vector3D;
        public startColor: Color;
        public endColor: Color;

        /**
		 * 创建线段
		 * @param start 起点坐标
		 * @param end 终点坐标
		 * @param colorStart 起点颜色
		 * @param colorEnd 终点颜色
		 * @param thickness 线段厚度
		 */
        constructor(start: Vector3D, end: Vector3D, colorStart: number = 0x333333, colorEnd: number = 0x333333, thickness: number = 1)
        {
            this.thickness = thickness * .5;
            this.start = start;
            this.end = end;
            this.startColor = new Color();
            this.startColor.fromUnit(colorStart, colorStart > 1 << 24);
            this.endColor = new Color();
            this.endColor.fromUnit(colorEnd, colorEnd > 1 << 24);
        }

        /**
         * 坐标数据
         */
        public get positionData()
        {
            return [this.start.x, this.start.y, this.start.z, this.end.x, this.end.y, this.end.z];
        }

        /**
         * 颜色数据
         */
        public get colorData()
        {
            return [
                this.startColor.r, this.startColor.g, this.startColor.b, this.startColor.a,
                this.endColor.r, this.endColor.g, this.endColor.b, this.endColor.a,
            ];
        }
    }
}