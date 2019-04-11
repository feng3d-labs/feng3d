namespace feng3d
{
	export interface OAVComponentParamMap
	{
		OAVDefault: OAVDefaultParam;
		OAVArray: OAVArrayParam;
		OAVPick: OAVPickParam;
		OAVEnum: OAVEnumParam;

		OAVCubeMap: { component: "OAVCubeMap", componentParam: Object };
		OAVImage: { component: "OAVImage", componentParam: Object };
		OAVObjectView: { component: "OAVObjectView", componentParam: Object };
		OAVParticleComponentList: { component: "OAVParticleComponentList", componentParam: Object };
		OAVComponentList: { component: "OAVComponentList", componentParam: Object };
		OAVGameObjectName: { component: "OAVGameObjectName", componentParam: Object };
		OAVMaterialName: { component: "OAVMaterialName", componentParam: Object };
		OAVMultiText: { component: "OAVMultiText", componentParam: Object };
		OAVFeng3dPreView: { component: "OAVFeng3dPreView", componentParam: Object };
		OAVAccordionObjectView: { component: "OAVAccordionObjectView", componentParam: Object };
	}

	/**
	 * OAVDefault 组件参数
	 */
	export interface OAVDefaultParam
	{
		component: "OAVDefault";

		componentParam: {
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
	}

	/**
	 * OAVArray 组件参数
	 */
	export interface OAVArrayParam 
	{
		component: "OAVArray";

		componentParam: {
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
	}

	/**
	 * OAVPick 组件参数
	 */
	export interface OAVPickParam 
	{
		component: "OAVPick";

		componentParam: {
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
	 * OAVEnum 组件参数
	 */
	export interface OAVEnumParam 
	{
		component: "OAVEnum";

		componentParam: {
            /**
             * 枚举类型
             */
			enumClass: any,
		}
	}
}