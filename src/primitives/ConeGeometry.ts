namespace feng3d
{
	export interface ConeGeometryRaw
	{
		__class__?: "feng3d.ConeGeometry",
        /**
         * 底部半径
         */
		bottomRadius?: number,
        /**
         * 高度
         */
		height?: number,
        /**
         * 横向分割数
         */
		segmentsW?: number,
        /**
         * 纵向分割数
         */
		segmentsH?: number,
        /**
         * 底部是否封口
         */
		bottomClosed?: boolean,
        /**
         * 是否朝上
         */
		yUp?: boolean
	}

	/**
	 * 圆锥体
     * @author feng 2017-02-07
	 */
	export class ConeGeometry extends CylinderGeometry implements ConeGeometryRaw
	{
		topRadius = 0;

		topClosed = false;

		surfaceClosed = true;

		/**
		 * 创建圆锥体
		 */
		constructor(raw?: ConeGeometryRaw)
		{
			super(<any>raw);
			this.name = "Cone";
		}
	}
}