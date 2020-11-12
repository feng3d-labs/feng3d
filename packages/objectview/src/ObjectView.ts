namespace feng3d
{
	/**
	 * 标记objectview对象界面类
	 */
	export function OVComponent(component?: string)
	{
		return (constructor: Function) =>
		{
			component = component || constructor["name"];
			objectview.OVComponent[<string>component] = constructor;
		}
	}

	/**
	 * 标记objectview块界面类
	 */
	export function OBVComponent(component?: string)
	{
		return (constructor: Function) =>
		{
			component = component || constructor["name"];
			objectview.OBVComponent[<string>component] = constructor;
		}
	}

	/**
	 * 标记objectview属性界面类
	 */
	export function OAVComponent(component?: string)
	{
		return (constructor: Function) =>
		{
			component = component || constructor["name"];
			objectview.OAVComponent[<string>component] = constructor;
		}
	}

	/**
	 * objectview类装饰器
	 */
	export function ov<K extends keyof OVComponentParamMap>(param: { component?: K; componentParam?: OVComponentParamMap[K]; })
	{
		return (constructor: Function) =>
		{
			if (!Object.getOwnPropertyDescriptor(constructor["prototype"], OBJECTVIEW_KEY))
				constructor["prototype"][OBJECTVIEW_KEY] = {};
			var objectview: ClassDefinition = constructor["prototype"][OBJECTVIEW_KEY];
			objectview.component = <string>param.component;
			objectview.componentParam = param.componentParam;
		}
	}

	// /**
	//  * objectview类装饰器
	//  */
	// export function obv<K extends keyof OBVComponentParam>(param: { name: string; component?: K; componentParam?: OBVComponentParam[K]; })
	// {
	// 	return (constructor: Function) =>
	// 	{
	// 		if (!Object.getOwnPropertyDescriptor(constructor["prototype"], OBJECTVIEW_KEY))
	// 			constructor["prototype"][OBJECTVIEW_KEY] = {};
	// 		var objectview: ClassDefinition = constructor["prototype"][OBJECTVIEW_KEY];
	// 		var blockDefinitionVec: BlockDefinition[] = objectview.blockDefinitionVec = objectview.blockDefinitionVec || [];
	// 		blockDefinitionVec.push({
	// 			name: param.name,
	// 			component: param.component,
	// 			componentParam: param.componentParam,
	// 		});
	// 	}
	// }

	export type OAVComponentParams = Partial<OAVComponentParamMap[keyof OAVComponentParamMap]> & {

		/**
		 * 是否可编辑
		 */
		editable?: boolean;

		/**
		 * 所属块名称
		 */
		block?: string;

		/**
		 * 提示信息
		 */
		tooltip?: string;

		/**
		 * 优先级，数字越小，显示越靠前，默认为0
		 */
		priority?: number;

		/**
		 * 是否排除
		 */
		exclude?: boolean;
	};

	/**
	 * objectview属性装饰器
	 * @param param 参数
	 */
	export function oav(param?: OAVComponentParams)
	{
		return (target: any, propertyKey: string) =>
		{
			objectview.addOAV(target, propertyKey, param);
		}
	}

	/**
	 * 对象界面
	 */
	export var objectview: ObjectView;

	/**
	 * 对象界面
	 */
	export class ObjectView
	{
		/**
		 * 默认基础类型对象界面类定义
		 */
		defaultBaseObjectViewClass = ""
		/**
		 * 默认对象界面类定义
		 */
		defaultObjectViewClass = ""
		/**
		 * 默认对象属性界面类定义
		 */
		defaultObjectAttributeViewClass = ""
		/**
		 * 属性块默认界面
		 */
		defaultObjectAttributeBlockView = ""
		/**
		 * 指定属性类型界面类定义字典（key:属性类名称,value:属性界面类定义）
		 */
		defaultTypeAttributeView = {}
		OAVComponent = {}
		OBVComponent = {}
		OVComponent = {}
		setDefaultTypeAttributeView(type: string, component: AttributeTypeDefinition)
		{
			this.defaultTypeAttributeView[type] = component;
		}

		/**
		 * 获取对象界面
		 * @param object 用于生成界面的对象
		 * @param param 参数
		 */
		getObjectView(object: Object, param?: GetObjectViewParam): IObjectView
		{
			var p: GetObjectViewParam = { autocreate: true, excludeAttrs: [] };
			Object.assign(p, param);

			var classConfig = this.getObjectInfo(object, p.autocreate, p.excludeAttrs);
			classConfig.editable = classConfig.editable == undefined ? true : classConfig.editable;

			Object.assign(classConfig, param);

			// 处理 exclude
			classConfig.objectAttributeInfos = classConfig.objectAttributeInfos.filter(v => !v.exclude);
			classConfig.objectBlockInfos.forEach(v =>
			{
				v.itemList = v.itemList.filter(vv => !vv.exclude);
			});

			classConfig.objectAttributeInfos.forEach(v => { v.editable = v.editable && classConfig.editable; });

			if (classConfig.component == null || classConfig.component == "")
			{
				//返回基础类型界面类定义
				if (!(classConfig.owner instanceof Object))
				{
					classConfig.component = this.defaultBaseObjectViewClass;
				} else
				{
					//使用默认类型界面类定义
					classConfig.component = this.defaultObjectViewClass;
				}
			}

			var cls = this.OVComponent[classConfig.component];
			console.assert(cls != null, `没有定义 ${classConfig.component} 对应的对象界面类，需要在 ${classConfig.component} 中使用@OVComponent()标记`);
			var view = new cls(classConfig)
			return view;
		}
		/**
		 * 获取属性界面
		 * 
		 * @static
		 * @param {AttributeViewInfo} attributeViewInfo			属性界面信息
		 * @returns {egret.DisplayObject}						属性界面
		 * 
		 * @memberOf ObjectView
		 */
		getAttributeView(attributeViewInfo: AttributeViewInfo): IObjectAttributeView
		{
			if (attributeViewInfo.component == null || attributeViewInfo.component == "")
			{
				var defaultViewClass = this.defaultTypeAttributeView[attributeViewInfo.type];
				var tempComponent = defaultViewClass ? defaultViewClass.component : "";
				if (tempComponent != null && tempComponent != "")
				{
					attributeViewInfo.component = defaultViewClass.component;
					attributeViewInfo.componentParam = defaultViewClass.componentParam || attributeViewInfo.componentParam;
				}
			}

			if (attributeViewInfo.component == null || attributeViewInfo.component == "")
			{
				//使用默认对象属性界面类定义
				attributeViewInfo.component = this.defaultObjectAttributeViewClass;
			}

			var cls = this.OAVComponent[attributeViewInfo.component];
			console.assert(cls != null, `没有定义 ${attributeViewInfo.component} 对应的属性界面类，需要在 ${attributeViewInfo.component} 中使用@OVAComponent()标记`);
			var view = new cls(attributeViewInfo);
			return view;
		}
		/**
		 * 获取块界面
		 * 
		 * @static
		 * @param {BlockViewInfo} blockViewInfo			块界面信息
		 * @returns {egret.DisplayObject}				块界面
		 * 
		 * @memberOf ObjectView
		 */
		getBlockView(blockViewInfo: BlockViewInfo): IObjectBlockView
		{
			if (blockViewInfo.component == null || blockViewInfo.component == "")
			{
				//返回默认对象属性界面类定义
				blockViewInfo.component = this.defaultObjectAttributeBlockView;
			}

			var cls = this.OBVComponent[blockViewInfo.component];
			console.assert(cls != null, `没有定义 ${blockViewInfo.component} 对应的块界面类，需要在 ${blockViewInfo.component} 中使用@OVBComponent()标记`);
			var view = new cls(blockViewInfo);
			return view;
		}

		addOAV(target: any, propertyKey: string, param?: OAVComponentParams)
		{
			if (!Object.getOwnPropertyDescriptor(target, OBJECTVIEW_KEY))
				target[OBJECTVIEW_KEY] = {};
			var objectview: ClassDefinition = target[OBJECTVIEW_KEY] || {};
			var attributeDefinitionVec: AttributeDefinition[] = objectview.attributeDefinitionVec = objectview.attributeDefinitionVec || [];

			var attributeDefinition = Object.assign({ name: propertyKey }, param);
			attributeDefinitionVec.push(attributeDefinition);
		}

		/**
		 * 获取对象信息
		 * @param object				对象
		 * @param autocreate			当对象没有注册属性时是否自动创建属性信息
		 * @param excludeAttrs			排除属性列表
		 * @return
		 */
		getObjectInfo(object: Object, autocreate = true, excludeAttrs: string[] = []): ObjectViewInfo
		{
			if (typeof object == "string" || typeof object == "number" || typeof object == "boolean")
			{
				return {
					objectAttributeInfos: [],
					objectBlockInfos: [],
					owner: object,
					component: "",
					componentParam: undefined
				};
			}

			var classConfig = getInheritClassDefinition(object, autocreate);

			classConfig = classConfig || {
				component: "",
				componentParam: null,
				attributeDefinitionVec: [],
				blockDefinitionVec: [],
			};

			var objectAttributeInfos: AttributeViewInfo[] = [];
			classConfig.attributeDefinitionVec.forEach(attributeDefinition =>
			{
				if (excludeAttrs.indexOf(attributeDefinition.name) == -1)
				{
					var editable = attributeDefinition.editable == undefined ? true : attributeDefinition.editable;
					editable = editable && Object.propertyIsWritable(object, attributeDefinition.name);

					var obj: AttributeViewInfo = <any>{ owner: object, type: getAttributeType(object[attributeDefinition.name]) };
					Object.assign(obj, attributeDefinition);
					obj.editable = editable;
					objectAttributeInfos.push(obj);
				}

			});

			function getAttributeType(attribute): string
			{
				if (attribute == null)
					return "null";
				if (typeof attribute == "number")
					return "number";
				return attribute.constructor.name;
			}

			objectAttributeInfos.forEach((v, i) => { v["___tempI"] = i });
			objectAttributeInfos.sort((a, b) =>
			{
				return ((a.priority || 0) - (b.priority || 0)) || (a["___tempI"] - b["___tempI"]);
			});
			objectAttributeInfos.forEach((v, i) => { delete v["___tempI"] });

			var objectInfo: ObjectViewInfo = {
				objectAttributeInfos: objectAttributeInfos,
				objectBlockInfos: getObjectBlockInfos(object, objectAttributeInfos, classConfig.blockDefinitionVec),
				owner: object,
				component: classConfig.component,
				componentParam: classConfig.componentParam
			};
			return objectInfo;
		}
	}

	objectview = new ObjectView();

	var OBJECTVIEW_KEY = "__objectview__";

	function mergeClassDefinition(oldClassDefinition: ClassDefinition, newClassDefinition: ClassDefinition)
	{
		if (newClassDefinition.component && newClassDefinition.component.length > 0)
		{
			oldClassDefinition.component = newClassDefinition.component;
			oldClassDefinition.componentParam = newClassDefinition.componentParam;
		}
		//合并属性
		oldClassDefinition.attributeDefinitionVec = oldClassDefinition.attributeDefinitionVec || [];
		if (newClassDefinition.attributeDefinitionVec && newClassDefinition.attributeDefinitionVec.length > 0)
		{
			newClassDefinition.attributeDefinitionVec.forEach(newAttributeDefinition =>
			{
				var isfound = false;
				oldClassDefinition.attributeDefinitionVec.forEach(oldAttributeDefinition =>
				{
					if (newAttributeDefinition && oldAttributeDefinition.name == newAttributeDefinition.name)
					{
						Object.assign(oldAttributeDefinition, newAttributeDefinition);
						//
						var oldIndex = oldClassDefinition.attributeDefinitionVec.indexOf(oldAttributeDefinition);
						oldClassDefinition.attributeDefinitionVec.splice(oldIndex, 1);
						//
						oldClassDefinition.attributeDefinitionVec.push(oldAttributeDefinition);
						isfound = true;
					}
				});
				if (!isfound)
				{
					var attributeDefinition: AttributeDefinition = <any>{};
					Object.assign(attributeDefinition, newAttributeDefinition);
					oldClassDefinition.attributeDefinitionVec.push(attributeDefinition);
				}
			});
		}
		//合并块
		oldClassDefinition.blockDefinitionVec = oldClassDefinition.blockDefinitionVec || [];
		if (newClassDefinition.blockDefinitionVec && newClassDefinition.blockDefinitionVec.length > 0)
		{
			newClassDefinition.blockDefinitionVec.forEach(newBlockDefinition =>
			{
				var isfound = false;
				oldClassDefinition.blockDefinitionVec.forEach(oldBlockDefinition =>
				{
					if (newBlockDefinition && newBlockDefinition.name == oldBlockDefinition.name)
					{
						Object.assign(oldBlockDefinition, newBlockDefinition);
						isfound = true;
					}
				});
				if (!isfound)
				{
					var blockDefinition: BlockDefinition = <any>{};
					Object.assign(blockDefinition, newBlockDefinition);
					oldClassDefinition.blockDefinitionVec.push(blockDefinition);
				}
			});
		}
	}

	function getInheritClassDefinition(object: Object, autocreate = true)
	{
		var classConfigVec: ClassDefinition[] = [];
		var prototype = object;
		while (prototype)
		{
			var classConfig: ClassDefinition = prototype[OBJECTVIEW_KEY];
			if (classConfig)
				classConfigVec.push(classConfig);
			prototype = prototype["__proto__"];
		}
		var resultclassConfig: ClassDefinition;
		if (classConfigVec.length > 0)
		{
			resultclassConfig = <any>{};
			for (var i = classConfigVec.length - 1; i >= 0; i--)
			{
				mergeClassDefinition(resultclassConfig, classConfigVec[i]);
			}
		} else if (autocreate)
		{
			resultclassConfig = getDefaultClassConfig(object);
		}
		return resultclassConfig;
	}

	function getDefaultClassConfig(object: Object, filterReg = /(([a-zA-Z0-9])+|(\d+))/)
	{
		//
		var attributeNames: string[] = [];
		for (var key in object)
		{
			var result = filterReg.exec(key);
			if (result && result[0] == key)
			{
				var value = object[key];
				if (value === undefined || value instanceof Function)
					continue;
				attributeNames.push(key);
			}
		}
		attributeNames = attributeNames.sort();

		var attributeDefinitionVec: AttributeDefinition[] = [];
		attributeNames.forEach(element =>
		{
			attributeDefinitionVec.push({
				name: element,
				block: "",
			});
		});

		var defaultClassConfig: ClassDefinition = {
			component: "",
			attributeDefinitionVec: attributeDefinitionVec,
			blockDefinitionVec: []
		}

		return defaultClassConfig;
	}

	/**
	 * 获取对象块信息列表
	 * @param {Object} object			对象
	 * @returns {BlockViewInfo[]}		对象块信息列表
	 */
	function getObjectBlockInfos(object: Object, objectAttributeInfos: AttributeViewInfo[], blockDefinitionVec?: BlockDefinition[]): BlockViewInfo[]
	{
		var objectBlockInfos: BlockViewInfo[] = [];
		var dic: { [blockName: string]: BlockViewInfo } = {};
		var objectBlockInfo: BlockViewInfo

		//收集块信息
		var i: number = 0;
		var tempVec: BlockViewInfo[] = [];
		for (i = 0; i < objectAttributeInfos.length; i++)
		{
			var blockName = objectAttributeInfos[i].block || "";
			objectBlockInfo = dic[blockName];
			if (objectBlockInfo == null)
			{
				objectBlockInfo = dic[blockName] = { name: blockName, owner: object, itemList: [] };
				tempVec.push(objectBlockInfo);
			}
			objectBlockInfo.itemList.push(objectAttributeInfos[i]);
		}

		//按快的默认顺序生成 块信息列表
		var blockDefinition: BlockDefinition;
		var pushDic = {};

		if (blockDefinitionVec)
		{
			for (i = 0; i < blockDefinitionVec.length; i++)
			{
				blockDefinition = blockDefinitionVec[i];
				objectBlockInfo = dic[blockDefinition.name];
				if (objectBlockInfo == null)
				{
					objectBlockInfo = {
						name: blockDefinition.name,
						owner: object,
						itemList: []
					};
				}
				objectBlockInfo.component = blockDefinition.component;
				objectBlockInfo.componentParam = blockDefinition.componentParam;
				objectBlockInfos.push(objectBlockInfo);
				pushDic[objectBlockInfo.name] = true;
			}
		}
		//添加剩余的块信息
		for (i = 0; i < tempVec.length; i++)
		{
			if (Boolean(pushDic[tempVec[i].name]) == false)
			{
				objectBlockInfos.push(tempVec[i]);
			}
		}

		return objectBlockInfos;
	}

	/**
	 * OAV 组件参数映射
	 * {key: OAV组件名称,value：组件参数类定义}
	 */
	export interface OAVComponentParamMap
	{
		OAVEnum: OAVEnumParam;
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

	export interface OBVComponentParamMap
	{
		块组件名称: "块组件参数";
		[component: string]: any;
	}

	export interface OVComponentParamMap
	{
		类组件名称: "类组件参数";
		[component: string]: any;
	}

    /**
	 * 定义属性
	 */
	export interface AttributeDefinition
	{
		/**
		 * 属性名称
		 */
		name: string;

		/**
		 * 是否可编辑
		 */
		editable?: boolean;

		/**
		 * 所属块名称
		 */
		block?: string;

		/**
		 * 提示信息
		 */
		tooltip?: string;

		/**
		 * 组件
		 */
		component?: string;

		/**
		 * 组件参数
		 */
		componentParam?: Object;

		/**
		 * 优先级，数字越小，显示越靠前，默认为0
		 */
		priority?: number;

		/**
		 * 是否排除
		 */
		exclude?: boolean;
	}

	/**
	 * 定义特定属性类型默认界面
	 */
	export interface AttributeTypeDefinition
	{
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
	 */
	export interface ClassDefinition
	{
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
		attributeDefinitionVec: AttributeDefinition[];

		/**
		 * 自定义对象属性块界面类定义字典（key:属性块名称,value:自定义对象属性块界面类定义）
		 */
		blockDefinitionVec: BlockDefinition[];
	}

	/**
	 * 对象属性界面接口
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

		/**
		 * 对象属性界面
		 */
		objectView: IObjectView;

		/**
		 * 对象属性块界面
		 */
		objectBlockView: IObjectBlockView;
	}

	/**
	 * 对象属性块界面接口
	 */
	export interface IObjectBlockView
	{
		/**
		 * 界面所属对象（空间）
		 */
		space: Object;

		/**
		 * 块名称
		 */
		blockName: string;

		/**
		 * 对象属性界面
		 */
		objectView: IObjectView;

		/**
		 * 更新界面
		 */
		updateView(): void;

		/**
		 * 获取属性界面
		 * @param attributeName		属性名称
		 */
		getAttributeView(attributeName: string): IObjectAttributeView;
	}

	/**
	 * 对象界面接口
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
		editable: boolean;

		/**
		 * 所属块名称
		 */
		block?: string;

		/**
		 * 提示信息
		 */
		tooltip?: string;

		/**
		 * 组件
		 */
		component?: string;

		/**
		 * 组件参数
		 */
		componentParam?: Object;

		/**
		 * 属性所属对象
		 */
		owner: Object;

		/**
		 * 优先级，数字越小，显示越靠前，默认为0
		 */
		priority?: number;

		/**
		 * 是否排除
		 */
		exclude?: boolean;
	}

	/**
	 * 对象属性块
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
	 */
	export interface ObjectViewInfo
	{
		/**
		 * 组件
		 */
		component?: string;

		/**
		 * 组件参数
		 */
		componentParam?: Object;

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

		/**
		 * 是否可编辑
		 */
		editable?: boolean;
	}

	export type GetObjectViewParam = {
		/**
		 * 当对象没有注册属性时是否自动创建属性信息
		 */
		autocreate?: boolean,
		/**
		 * 排除属性列表
		 */
		excludeAttrs?: string[]
		/**
		 * 是否可编辑
		 */
		editable?: boolean;
	};
}