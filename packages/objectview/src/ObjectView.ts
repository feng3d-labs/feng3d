declare global
{
	interface MixinsOAVComponentParamMap
	{
	}
}

/**
 * 构造函数
 */
type Constructor<T> = (new (...args: any[]) => T);

/**
 * 标记objectview对象界面类
 */
export function OVComponent(component?: string)
{
	return (constructor: Constructor<any>) =>
	{
		component = component || constructor.name;
		objectview.OVComponent[component] = constructor;
	};
}

/**
 * 标记objectview块界面类
 */
export function OBVComponent(component?: string)
{
	return (constructor: Constructor<any>) =>
	{
		component = component || constructor.name;
		objectview.OBVComponent[component] = constructor;
	};
}

/**
 * 标记objectview属性界面类
 */
export function OAVComponent(component?: string)
{
	return (constructor: Constructor<any>) =>
	{
		component = component || constructor.name;
		objectview.OAVComponent[component] = constructor;
	};
}

/**
 * objectview类装饰器
 */
export function ov<K extends keyof OVComponentParamMap>(param: { component?: K; componentParam?: OVComponentParamMap[K]; })
{
	return (constructor: Constructor<any>) =>
	{
		if (!Object.getOwnPropertyDescriptor(constructor.prototype, objectviewKey))
		{
			constructor.prototype[objectviewKey] = {};
		}
		const objectview: ClassDefinition = constructor.prototype[objectviewKey];
		objectview.component = param.component as string;
		objectview.componentParam = param.componentParam;
	};
}

// /**
//  * objectview类装饰器
//  */
// export function obv<K extends keyof OBVComponentParam>(param: { name: string; component?: K; componentParam?: OBVComponentParam[K]; })
// {
//     return (constructor: Function) =>
//     {
//         if (!Object.getOwnPropertyDescriptor(constructor["prototype"], OBJECTVIEW_KEY))
//             constructor["prototype"][OBJECTVIEW_KEY] = {};
//         var objectview: ClassDefinition = constructor["prototype"][OBJECTVIEW_KEY];
//         var blockDefinitionVec: BlockDefinition[] = objectview.blockDefinitionVec = objectview.blockDefinitionVec || [];
//         blockDefinitionVec.push({
//             name: param.name,
//             component: param.component,
//             componentParam: param.componentParam,
//         });
//     }
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
	};
}

/**
 * 对象界面
 */
export class ObjectView
{
	/**
	 * 默认基础类型对象界面类定义
	 */
	defaultBaseObjectViewClass = '';
	/**
	 * 默认对象界面类定义
	 */
	defaultObjectViewClass = '';
	/**
	 * 默认对象属性界面类定义
	 */
	defaultObjectAttributeViewClass = '';
	/**
	 * 属性块默认界面
	 */
	defaultObjectAttributeBlockView = '';
	/**
	 * 指定属性类型界面类定义字典（key:属性类名称,value:属性界面类定义）
	 */
	defaultTypeAttributeView = {};
	OAVComponent = {};
	OBVComponent = {};
	OVComponent = {};
	setDefaultTypeAttributeView(type: string, component: AttributeTypeDefinition)
	{
		this.defaultTypeAttributeView[type] = component;
	}

	/**
	 * 获取对象界面
	 * @param object 用于生成界面的对象
	 * @param param 参数
	 */
	getObjectView(object: any, param?: GetObjectViewParam): IObjectView
	{
		const p: GetObjectViewParam = { autocreate: true, excludeAttrs: [] };
		Object.assign(p, param);

		const classConfig = this.getObjectInfo(object, p.autocreate, p.excludeAttrs);
		classConfig.editable = classConfig.editable === undefined ? true : classConfig.editable;

		Object.assign(classConfig, param);

		// 处理 exclude
		classConfig.objectAttributeInfos = classConfig.objectAttributeInfos.filter((v) => !v.exclude);
		classConfig.objectBlockInfos.forEach((v) =>
		{
			v.itemList = v.itemList.filter((vv) => !vv.exclude);
		});

		classConfig.objectAttributeInfos.forEach((v) => { v.editable = v.editable && classConfig.editable; });

		if (objectIsEmpty(classConfig.component) || classConfig.component === '')
		{
			// 返回基础类型界面类定义
			if (!(classConfig.owner instanceof Object))
			{
				classConfig.component = this.defaultBaseObjectViewClass;
			}
			else
			{
				// 使用默认类型界面类定义
				classConfig.component = this.defaultObjectViewClass;
			}
		}

		const Cls = this.OVComponent[classConfig.component];
		console.assert(Cls !== null, `没有定义 ${classConfig.component} 对应的对象界面类，需要在 ${classConfig.component} 中使用@OVComponent()标记`);
		const view = new Cls(classConfig);

		return view;
	}
	/**
	 * 获取属性界面
	 *
	 * @static
	 * @param attributeViewInfo 属性界面信息
	 * @returns                        属性界面
	 *
	 * @memberOf ObjectView
	 */
	getAttributeView(attributeViewInfo: AttributeViewInfo): IObjectAttributeView
	{
		if (objectIsEmpty(attributeViewInfo.component) || attributeViewInfo.component === '')
		{
			const defaultViewClass = this.defaultTypeAttributeView[attributeViewInfo.type];
			const tempComponent = defaultViewClass ? defaultViewClass.component : '';
			if (tempComponent !== null && tempComponent !== '')
			{
				attributeViewInfo.component = defaultViewClass.component;
				attributeViewInfo.componentParam = defaultViewClass.componentParam || attributeViewInfo.componentParam;
			}
		}

		if (objectIsEmpty(attributeViewInfo.component) || attributeViewInfo.component === '')
		{
			// 使用默认对象属性界面类定义
			attributeViewInfo.component = this.defaultObjectAttributeViewClass;
		}

		const Cls = this.OAVComponent[attributeViewInfo.component];
		console.assert(Cls !== null, `没有定义 ${attributeViewInfo.component} 对应的属性界面类，需要在 ${attributeViewInfo.component} 中使用@OVAComponent()标记`);
		const view = new Cls(attributeViewInfo);

		return view;
	}
	/**
	 * 获取块界面
	 *
	 * @static
	 * @param blockViewInfo 块界面信息
	 * @returns                块界面
	 *
	 * @memberOf ObjectView
	 */
	getBlockView(blockViewInfo: BlockViewInfo): IObjectBlockView
	{
		if (objectIsEmpty(blockViewInfo.component) || blockViewInfo.component === '')
		{
			// 返回默认对象属性界面类定义
			blockViewInfo.component = this.defaultObjectAttributeBlockView;
		}

		const Cls = this.OBVComponent[blockViewInfo.component];
		console.assert(Cls !== null, `没有定义 ${blockViewInfo.component} 对应的块界面类，需要在 ${blockViewInfo.component} 中使用@OVBComponent()标记`);
		const view = new Cls(blockViewInfo);

		return view;
	}

	addOAV(target: any, propertyKey: string, param?: OAVComponentParams)
	{
		if (!Object.getOwnPropertyDescriptor(target, objectviewKey)) { target[objectviewKey] = {}; }
		const objectview: ClassDefinition = target[objectviewKey] || {};
		const attributeDefinitionVec: AttributeDefinition[] = objectview.attributeDefinitionVec = objectview.attributeDefinitionVec || [];

		const attributeDefinition = Object.assign({ name: propertyKey }, param);
		attributeDefinitionVec.push(attributeDefinition);
	}

	/**
	 * 获取对象信息
	 * @param object 对象
	 * @param autocreate 当对象没有注册属性时是否自动创建属性信息
	 * @param excludeAttrs 排除属性列表
	 * @return
	 */
	getObjectInfo(object: any, autocreate = true, excludeAttrs: string[] = []): ObjectViewInfo
	{
		if (typeof object === 'string' || typeof object === 'number' || typeof object === 'boolean')
		{
			return {
				objectAttributeInfos: [],
				objectBlockInfos: [],
				owner: object,
				component: '',
				componentParam: undefined
			};
		}

		let classConfig = getInheritClassDefinition(object, autocreate);

		classConfig = classConfig || {
			component: '',
			componentParam: null,
			attributeDefinitionVec: [],
			blockDefinitionVec: [],
		};

		const objectAttributeInfos: AttributeViewInfo[] = [];
		classConfig.attributeDefinitionVec.forEach((attributeDefinition) =>
		{
			if (excludeAttrs.indexOf(attributeDefinition.name) === -1)
			{
				let editable = attributeDefinition.editable === undefined ? true : attributeDefinition.editable;
				editable = editable && propertyIsWritable(object, attributeDefinition.name);

				const obj: AttributeViewInfo = { owner: object, type: getAttributeType(object[attributeDefinition.name]) } as any;
				Object.assign(obj, attributeDefinition);
				obj.editable = editable;
				objectAttributeInfos.push(obj);
			}
		});

		function getAttributeType(attribute): string
		{
			if (objectIsEmpty(attribute))
			{
				return 'null';
			}
			if (typeof attribute === 'number')
			{
				return 'number';
			}

			return attribute.constructor.name;
		}

		objectAttributeInfos.forEach((v, i) => { v[tempIKey] = i; });
		objectAttributeInfos.sort((a, b) =>
			((a.priority || 0) - (b.priority || 0)) || (a[tempIKey] - b[tempIKey]));
		objectAttributeInfos.forEach((v, _i) => { delete v[tempIKey]; });

		const objectInfo: ObjectViewInfo = {
			objectAttributeInfos,
			objectBlockInfos: getObjectBlockInfos(object, objectAttributeInfos, classConfig.blockDefinitionVec),
			owner: object,
			component: classConfig.component,
			componentParam: classConfig.componentParam
		};

		return objectInfo;
	}
}

/**
 * 对象界面
 */
export const objectview = new ObjectView();

function mergeClassDefinition(oldClassDefinition: ClassDefinition, newClassDefinition: ClassDefinition)
{
	if (newClassDefinition.component && newClassDefinition.component.length > 0)
	{
		oldClassDefinition.component = newClassDefinition.component;
		oldClassDefinition.componentParam = newClassDefinition.componentParam;
	}
	// 合并属性
	oldClassDefinition.attributeDefinitionVec = oldClassDefinition.attributeDefinitionVec || [];
	if (newClassDefinition.attributeDefinitionVec && newClassDefinition.attributeDefinitionVec.length > 0)
	{
		newClassDefinition.attributeDefinitionVec.forEach((newAttributeDefinition) =>
		{
			let isfound = false;
			oldClassDefinition.attributeDefinitionVec.forEach((oldAttributeDefinition) =>
			{
				if (newAttributeDefinition && oldAttributeDefinition.name === newAttributeDefinition.name)
				{
					Object.assign(oldAttributeDefinition, newAttributeDefinition);
					//
					const oldIndex = oldClassDefinition.attributeDefinitionVec.indexOf(oldAttributeDefinition);
					oldClassDefinition.attributeDefinitionVec.splice(oldIndex, 1);
					//
					oldClassDefinition.attributeDefinitionVec.push(oldAttributeDefinition);
					isfound = true;
				}
			});
			if (!isfound)
			{
				const attributeDefinition: AttributeDefinition = {} as any;
				Object.assign(attributeDefinition, newAttributeDefinition);
				oldClassDefinition.attributeDefinitionVec.push(attributeDefinition);
			}
		});
	}
	// 合并块
	oldClassDefinition.blockDefinitionVec = oldClassDefinition.blockDefinitionVec || [];
	if (newClassDefinition.blockDefinitionVec && newClassDefinition.blockDefinitionVec.length > 0)
	{
		newClassDefinition.blockDefinitionVec.forEach((newBlockDefinition) =>
		{
			let isfound = false;
			oldClassDefinition.blockDefinitionVec.forEach((oldBlockDefinition) =>
			{
				if (newBlockDefinition && newBlockDefinition.name === oldBlockDefinition.name)
				{
					Object.assign(oldBlockDefinition, newBlockDefinition);
					isfound = true;
				}
			});
			if (!isfound)
			{
				const blockDefinition: BlockDefinition = {} as any;
				Object.assign(blockDefinition, newBlockDefinition);
				oldClassDefinition.blockDefinitionVec.push(blockDefinition);
			}
		});
	}
}

function getInheritClassDefinition(object: any, autocreate = true)
{
	const classConfigVec: ClassDefinition[] = [];
	let prototype = object;
	while (prototype)
	{
		const classConfig: ClassDefinition = prototype[objectviewKey];
		if (classConfig) { classConfigVec.push(classConfig); }
		prototype = prototype[protoKey];
	}
	let resultclassConfig: ClassDefinition;
	if (classConfigVec.length > 0)
	{
		resultclassConfig = {} as any;
		for (let i = classConfigVec.length - 1; i >= 0; i--)
		{
			mergeClassDefinition(resultclassConfig, classConfigVec[i]);
		}
	}
	else if (autocreate)
	{
		resultclassConfig = getDefaultClassConfig(object);
	}

	return resultclassConfig;
}

function getDefaultClassConfig(object: any, filterReg = /(([a-zA-Z0-9])+|(\d+))/)
{
	//
	let attributeNames: string[] = [];
	for (const key in object)
	{
		const result = filterReg.exec(key);
		if (result && result[0] === key)
		{
			const value = object[key];
			if (value === undefined || value instanceof Function) { continue; }
			attributeNames.push(key);
		}
	}
	attributeNames = attributeNames.sort();

	const attributeDefinitionVec: AttributeDefinition[] = [];
	attributeNames.forEach((element) =>
	{
		attributeDefinitionVec.push({
			name: element,
			block: '',
		});
	});

	const defaultClassConfig: ClassDefinition = {
		component: '',
		attributeDefinitionVec,
		blockDefinitionVec: []
	};

	return defaultClassConfig;
}

/**
 * 获取对象块信息列表
 * @param object 对象
 * @returns        对象块信息列表
 */
function getObjectBlockInfos(object: any, objectAttributeInfos: AttributeViewInfo[], blockDefinitionVec?: BlockDefinition[]): BlockViewInfo[]
{
	const objectBlockInfos: BlockViewInfo[] = [];
	const dic: { [blockName: string]: BlockViewInfo } = {};
	let objectBlockInfo: BlockViewInfo;

	// 收集块信息
	let i = 0;
	const tempVec: BlockViewInfo[] = [];
	for (i = 0; i < objectAttributeInfos.length; i++)
	{
		const blockName = objectAttributeInfos[i].block || '';
		objectBlockInfo = dic[blockName];
		if (objectIsEmpty(objectBlockInfo))
		{
			objectBlockInfo = dic[blockName] = { name: blockName, owner: object, itemList: [] };
			tempVec.push(objectBlockInfo);
		}
		objectBlockInfo.itemList.push(objectAttributeInfos[i]);
	}

	// 按快的默认顺序生成 块信息列表
	let blockDefinition: BlockDefinition;
	const pushDic = {};

	if (blockDefinitionVec)
	{
		for (i = 0; i < blockDefinitionVec.length; i++)
		{
			blockDefinition = blockDefinitionVec[i];
			objectBlockInfo = dic[blockDefinition.name];
			if (objectIsEmpty(objectBlockInfo))
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
	// 添加剩余的块信息
	for (i = 0; i < tempVec.length; i++)
	{
		if (Boolean(pushDic[tempVec[i].name]) === false)
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
export interface OAVComponentParamMap extends MixinsOAVComponentParamMap
{
	OAVEnum: OAVEnumParam;
}

/**
 * OAVEnum 组件参数
 */
export interface OAVEnumParam
{
	component: 'OAVEnum';

	componentParam: {
		/**
		 * 枚举类型
		 */
		enumClass: any,
	}
}

export interface OBVComponentParamMap
{
	块组件名称: '块组件参数';
	[component: string]: any;
}

export interface OVComponentParamMap
{
	类组件名称: '类组件参数';
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
	componentParam?: any;

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
	componentParam?: any;
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
	componentParam?: any;
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
	componentParam?: any;

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
export interface IObjectAttributeView extends MixinsIObjectAttributeView
{
	/**
	 * 界面所属对象（空间）
	 */
	space: any;

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
	attributeValue: any;

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
export interface IObjectBlockView extends MixinsIObjectBlockView
{
	/**
	 * 界面所属对象（空间）
	 */
	space: any;

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
	 * @param attributeName 属性名称
	 */
	getAttributeView(attributeName: string): IObjectAttributeView;
}

/**
 * 对象界面接口
 */
export interface IObjectView extends MixinsIObjectView
{
	/**
	 * 界面所属对象（空间）
	 */
	space: any;

	/**
	 * 更新界面
	 */
	updateView(): void;

	/**
	 * 获取块界面
	 * @param blockName 块名称
	 */
	getblockView(blockName: string): IObjectBlockView;

	/**
	 * 获取属性界面
	 * @param attributeName 属性名称
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
	componentParam?: any;

	/**
	 * 属性所属对象
	 */
	owner: any;

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
	componentParam?: any;

	/**
	 * 属性信息列表
	 */
	itemList: AttributeViewInfo[];

	/**
	 * 属性拥有者
	 */
	owner: any;
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
	componentParam?: any;

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
	owner: any;

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

/**
 * 属性是否可写
 * @param obj 对象
 * @param property 属性名称
 */
function propertyIsWritable(obj: any, property: string): boolean
{
	const data = getPropertyDescriptor(obj, property);
	if (!data) return false;
	if (data.get && !data.set) return false;

	return true;
}

/**
 * 从对象自身或者对象的原型中获取属性描述
 *
 * @param object 对象
 * @param property 属性名称
 */
function getPropertyDescriptor(object: any, property: string): PropertyDescriptor | undefined
{
	const data = Object.getOwnPropertyDescriptor(object, property);
	if (data)
	{
		return data;
	}
	const prototype = Object.getPrototypeOf(object);
	if (prototype)
	{
		return getPropertyDescriptor(prototype, property);
	}

	return undefined;
}

const tempIKey = '___tempI';
const protoKey = '__proto__';
const objectviewKey = '__objectview__';

/**
 * 判断对象是否为null或者undefine
 *
 * @param obj
 * @returns
 */
function objectIsEmpty(obj: any)
{
	if (obj === undefined || obj === null)
	{ return true; }

	return false;
}
