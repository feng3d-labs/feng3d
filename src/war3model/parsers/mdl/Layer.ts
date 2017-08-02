namespace feng3d.war3
{

	/**
	 * 材质层
	 * @author warden_feng 2014-6-26
	 */
	export class Layer
	{
		/** 过滤模式 */
		FilterMode: string;
		/** 贴图ID */
		TextureID: number;
		/** 透明度 */
		Alpha: number;
		/** 是否有阴影 */
		Unshaded: boolean;
		/** 是否无雾化 */
		Unfogged: boolean;
		/** 是否双面 */
		TwoSided: boolean;
		/** 是否开启地图环境范围 */
		SphereEnvMap: boolean;
		/** 是否无深度测试 */
		NoDepthTest: boolean;
		/** 是否无深度设置 */
		NoDepthSet: boolean;
	}
}