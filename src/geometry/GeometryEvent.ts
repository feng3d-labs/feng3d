namespace feng3d
{

	/**
	 * 几何体事件
	 * @author feng 2015-12-8
	 */
	export class GeometryEvent
	{
		/**
		 * 获取几何体顶点数据
		 */
		static GET_VA_DATA: string = "getVAData";

		/**
		 * 改变几何体顶点数据事件
		 */
		static CHANGED_VA_DATA: string = "changedVAData";

		/**
		 * 改变顶点索引数据事件
		 */
		static CHANGED_INDEX_DATA: string = "changedIndexData";

		/**
		 * 包围盒失效
		 */
		static BOUNDS_INVALID = "boundsInvalid";
	}
}
