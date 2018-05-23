namespace feng3d
{
	/**
	 * 圆锥体
     * @author feng 2017-02-07
	 */
	export class ConeGeometry extends CylinderGeometry
	{
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