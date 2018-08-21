namespace feng3d
{
	/**
	 * 圆锥体

	 */
	export class ConeGeometry extends CylinderGeometry
	{
        __class__: "feng3d.ConeGeometry" = "feng3d.ConeGeometry";
		
        /**
         * 底部半径 private
         */
		topRadius = 0;

        /**
         * 顶部是否封口 private
         */
		topClosed = false;

        /**
         * 侧面是否封口 private
         */
		surfaceClosed = true;

		/**
		 * 创建圆锥体
		 */
		constructor(raw?: gPartial<ConeGeometry>)
		{
			super(<any>raw);
			this.name = "Cone";
		}
	}
}