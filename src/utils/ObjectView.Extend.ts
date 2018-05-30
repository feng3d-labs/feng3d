namespace feng3d
{
	export interface OAVComponentParamMap
	{
		OAVDefault: OAVDefaultParam;
		OAVArray: OAVArrayParam;
		OAVPick: OAVPickParam;
		OAVEnum: OAVEnumParam;
		// OAVVector3D: OAVVector3DParam;
	}

	/**
	 * OAVDefault 组件参数
	 */
	export interface OAVDefaultParam extends OAVComponentParamBase
	{
		/**
		 * 文本是否可编辑
		 */
		textEnabled?: boolean;

		/**
		 * 拾取参数
		 */
		dragparam?: {
			/**
			 * 可接受数据类型
			 */
			accepttype: string,
			/**
			 * 提供数据类型
			 */
			datatype?: string,
		}
	}

	/**
	 * OAVArray 组件参数
	 */
	export interface OAVArrayParam extends OAVComponentParamBase
	{
		/**
		 * 拾取参数
		 */
		dragparam?: {
			/**
			 * 可接受数据类型
			 */
			accepttype: string,
			/**
			 * 提供数据类型
			 */
			datatype?: string,
		},
		/**
		 * 添加item时默认数据，赋值 ()=>any
		 */
		defaultItem: any
	}

	/**
	 * OAVPick 组件参数
	 */
	export interface OAVPickParam extends OAVComponentParamBase
	{
		/**
		 * 可接受数据类型
		 */
		accepttype: string,
		/**
		 * 提供数据类型
		 */
		datatype?: string,
	}

	/**
	 * OAVEnum 组件参数
	 */
	export interface OAVEnumParam extends OAVComponentParamBase
	{
		/**
		 * 枚举类型
		 */
		enumClass: any,
	}

	// /**
	//  * OAVVector3D 组件参数
	//  */
	// export interface OAVVector3DParam extends OAVComponentParamBase
	// {
	// 	/**
	// 	 * 是否显示W
	// 	 */
	// 	showw: boolean,
	// }
}