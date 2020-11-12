namespace feng3d
{

	/**
	 * 坐标系统类型
	 */
	export enum CoordinateSystem
	{
		/**
		 * 默认坐标系统，左手坐标系统
		 */
		LEFT_HANDED,

		/**
		 * 右手坐标系统
		 */
		RIGHT_HANDED,
	}

    /**
     * 引擎中使用的坐标系统，默认左手坐标系统。
     * 
     * three.js 右手坐标系统。
     * playcanvas 右手坐标系统。
     * unity    左手坐标系统。
     */
	export var coordinateSystem = CoordinateSystem.LEFT_HANDED;
}
