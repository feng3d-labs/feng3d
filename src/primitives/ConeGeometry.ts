module feng3d
{

	/**
	 * 圆锥体
     * @author feng 2017-02-07
	 */
	export class ConeGeometry extends CylinderGeometry
	{
		/**
		 * 创建圆锥体
		 * @param radius 底部半径
		 * @param height 高度
		 * @param segmentsW
		 * @param segmentsH
		 * @param yUp
		 */
		constructor(radius = 50, height = 100, segmentsW = 16, segmentsH = 1, closed = true, yUp = true)
		{
			super(0, radius, height, segmentsW, segmentsH, false, closed, true, yUp);
		}
	}
}