namespace feng3d.war3
{

	/**
	 * 几何设置
	 * @author warden_feng 2014-6-26
	 */
	export class Geoset
	{
		/** 顶点 */
		Vertices: number[];
		/** 法线 */
		Normals: number[];
		/** 纹理坐标 */
		TVertices: number[];
		/** 顶点分组 */
		VertexGroup: number[];
		/** 面（索引） */
		Faces: number[];
		/** 顶点分组 */
		Groups: number[][];
		/** 最小范围 */
		MinimumExtent: Vector3D;
		/** 最大范围 */
		MaximumExtent: Vector3D;
		/** 半径范围 */
		BoundsRadius: number;
		/** 动作信息 */
		Anims: AnimInfo1[] = [];
		/** 材质编号 */
		MaterialID: number;
		/**  */
		SelectionGroup: number;
		/** 是否不可选 */
		Unselectable: boolean;

		/** 顶点对应的关节索引 */
		jointIndices: number[];
		/** 顶点对应的关节权重 */
		jointWeights: number[];
	}
}