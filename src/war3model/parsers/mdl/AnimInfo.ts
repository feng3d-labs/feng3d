namespace feng3d.war3
{
	/**
	 * 全局动作信息
	 * @author warden_feng 2014-6-26
	 */
	export class AnimInfo
	{
		/** 动作名称 */
		name:string;
		/** 动作间隔 */
		interval: Interval;
		/** 最小范围 */
		MinimumExtent: Vector3D;
		/** 最大范围 */
		MaximumExtent: Vector3D;
		/** 半径范围 */
		BoundsRadius: number;
		/** 发生频率 */
		Rarity: number;
		/** 是否循环 */
		loop:boolean = true;
		/** 移动速度 */
		MoveSpeed: number;
	}
}