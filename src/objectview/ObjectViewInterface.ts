namespace feng3d
{
	export interface ObjectView
	{
		getObjectView: (object: Object) => any;
		getAttributeView: (attributeViewInfo: AttributeViewInfo) => any;
		getBlockView: (blockViewInfo: BlockViewInfo) => any;
		mergeConfig: (config: ObjectViewConfig) => void;
		config: ObjectViewConfig;
	}

    /**
	 * 定义属性
	 * @author feng 2016-3-23
	 */
	export interface AttributeDefinition
	{
		/**
		 * 属性名称
		 */
		name: string;

		/**
		 * 所属块名称
		 */
		block?: string;

		/**
		 * 组件
		 */
		component?: string;

		/**
		 * 组件参数
		 */
		componentParam?: Object;
	}

	/**
	 * 定义特定属性类型默认界面
	 * @author feng 2016-3-25
	 */
	export interface AttributeTypeDefinition
	{
		/**
		 * 属性类型
		 */
		type: string;
		/**
		 * 界面类
		 */
		component: string;
		/**
		 * 组件参数
		 */
		componentParam?: Object;
	}

	/**
	 * 块定义
	 * @author feng 2016-3-23
	 */
	export interface BlockDefinition
	{
		/**
		 * 块名称
		 */
		name: string;

		/**
		 * 组件
		 */
		component?: string;

		/**
		 * 组件参数
		 */
		componentParam?: Object;
	}

	/**
	 * ObjectView类配置
	 * @author feng 2016-3-23
	 */
	export interface ClassDefinition
	{
		/**
		 * 类名
		 */
		name: string;

		/**
		 * 组件
		 */
		component?: string;

		/**
		 * 组件参数
		 */
		componentParam?: Object;

		/**
		 * 自定义对象属性定义字典（key:属性名,value:属性定义）
		 */
		attributeDefinitionVec?: AttributeDefinition[];

		/**
		 * 自定义对象属性块界面类定义字典（key:属性块名称,value:自定义对象属性块界面类定义）
		 */
		blockDefinitionVec?: BlockDefinition[];
	}

	/**
	 * 对象属性界面接口
	 * @author feng 2016-3-10
	 */
	export interface IObjectAttributeView
	{
		/**
		 * 界面所属对象（空间）
		 */
		space: Object;

		/**
		 * 更新界面
		 */
		updateView(): void;

		/**
		 * 属性名称
		 */
		attributeName: string;

		/**
		 * 属性值
		 */
		attributeValue: Object;
	}

	/**
	 * 对象属性块界面接口
	 * @author feng 2016-3-22
	 */
	export interface IObjectBlockView
	{
		/**
		 * 界面所属对象（空间）
		 */
		space: Object;

		/**
		 * 更新界面
		 */
		updateView(): void;

		/**
		 * 块名称
		 */
		blockName: string;

		/**
		 * 获取属性界面
		 * @param attributeName		属性名称
		 */
		getAttributeView(attributeName: string): IObjectAttributeView;
	}

	/**
	 * 对象界面接口
	 * @author feng 2016-3-11
	 */
	export interface IObjectView
	{
		/**
		 * 界面所属对象（空间）
		 */
		space: Object;

		/**
		 * 更新界面
		 */
		updateView(): void;

		/**
		 * 获取块界面
		 * @param blockName		块名称
		 */
		getblockView(blockName: string): IObjectBlockView;

		/**
		 * 获取属性界面
		 * @param attributeName		属性名称
		 */
		getAttributeView(attributeName: string): IObjectAttributeView;
	}

	/**
	 * 对象属性信息
	 * @author feng 2016-3-10
	 */
	export interface AttributeViewInfo
	{
		/**
		 * 属性名称
		 */
		name: string;

		/**
		 * 属性类型
		 */
		type: string;

		/**
		 * 是否可写
		 */
		writable: boolean;

		/**
		 * 所属块名称
		 */
		block: string;

		/**
		 * 组件
		 */
		component: string;

		/**
		 * 组件参数
		 */
		componentParam: Object;

		/**
		 * 属性所属对象
		 */
		owner: Object;
	}

	/**
	 * 对象属性块
	 * @author feng 2016-3-22
	 */
	export interface BlockViewInfo
	{
		/**
		 * 块名称
		 */
		name: string;

		/**
		 * 组件
		 */
		component?: string;

		/**
		 * 组件参数
		 */
		componentParam?: Object;

		/**
		 * 属性信息列表
		 */
		itemList: AttributeViewInfo[];

		/**
		 * 属性拥有者
		 */
		owner: Object;
	}

	/**
	 * 对象信息
	 * @author feng 2016-3-29
	 */
	export interface ObjectViewInfo
	{
		/**
		 * 类名
		 */
		name: string;

		/**
		 * 组件
		 */
		component: string;

		/**
		 * 组件参数
		 */
		componentParam: Object;

		/**
		 * 对象属性列表
		 */
		objectAttributeInfos: AttributeViewInfo[];

		/**
		 * 对象块信息列表
		 */
		objectBlockInfos: BlockViewInfo[];

		/**
		 * 保存类的一个实例，为了能够获取动态属性信息
		 */
		owner: Object;
	}

	/**
	 * ObjectView总配置数据
	 * @author feng 2016-3-23
	 */
	export interface ObjectViewConfig
	{
		/**
		 * 默认基础类型对象界面类定义
		 */
		defaultBaseObjectViewClass?: string;

		/**
		 * 默认对象界面类定义
		 */
		defaultObjectViewClass?: string;

		/**
		 * 默认对象属性界面类定义
		 */
		defaultObjectAttributeViewClass?: string;

		/**
		 * 属性块默认界面
		 */
		defaultObjectAttributeBlockView?: string;

		/**
		 * 指定属性类型界面类定义字典（key:属性类名称,value:属性界面类定义）
		 */
		attributeDefaultViewClassByTypeVec?: AttributeTypeDefinition[];

		/**
		 * ObjectView类配置字典 （key：类名称，value：ObjectView类配置）
		 */
		classConfigVec?: ClassDefinition[];
	}
}