namespace feng3d
{
	/**
	 * 圆锥体

	 */
	export class ConeGeometry extends CylinderGeometry
	{
		__class__: "feng3d.ConeGeometry" = "feng3d.ConeGeometry";

		name = "Cone";

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
	}

	Feng3dAssets.setAssets(Geometry.cone = Object.setValue(new ConeGeometry(), { name: "Cone", assetsId: "Cone", hideFlags: HideFlags.NotEditable }));
}