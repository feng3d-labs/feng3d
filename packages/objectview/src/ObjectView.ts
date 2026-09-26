declare global
{
	interface MixinsOAVComponentParamMap
	{
	}
}

/**
 * 构造函数类型（界面实例类型未知，由各宿主框架提供具体实现）
 */
type Constructor<T = unknown> = (new (...args: unknown[]) => T);

/**
 * 标记objectview对象界面类
 */
export function OVComponent(component?: string)
{
	return (constructor: Constructor) =>
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
	return (constructor: Constructor) =>
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
	return (constructor: Constructor) =>
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
	return (constructor: Constructor) =>
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
	return (target: object, propertyKey: string) =>
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
	defaultTypeAttributeView: Record<string, AttributeTypeDefinition> = {};

	/**
	 * 纯数据类型的字段描述表（key: `__type__` 字面量,value: 该类型的字段清单）。
	 *
	 * 由**上层注入**（编辑器用 `scripts/gen-objectview-schema.mjs` 从 feng3d 的纯数据接口生成）。
	 * 本包不自己去找类型：`objectview` 是下层包，依赖只向下（根规范 §15 R1）。
	 */
	dataTypeSchema: DataTypeSchema = {};

	/**
	 * 注册纯数据类型的字段描述表。
	 *
	 * @param schema `__type__` → 该类型的字段清单
	 */
	setDataTypeSchema(schema: DataTypeSchema)
	{
		this.dataTypeSchema = schema;
	}

	/**
	 * 人工配置表（key: `__type__`）：对象级视图控件、分组、字段显示细节。
	 *
	 * 与 {@link dataTypeSchema} 同样由上层注入。
	 */
	objectViewConfig: ObjectViewConfigMap = {};

	/**
	 * 注册人工配置表。
	 *
	 * @param config `__type__` → 对象/分组/字段配置
	 */
	setObjectViewConfig(config: ObjectViewConfigMap)
	{
		this.objectViewConfig = config;
	}

	OAVComponent: Record<string, Constructor> = {};
	OBVComponent: Record<string, Constructor> = {};
	OVComponent: Record<string, Constructor> = {};
	setDefaultTypeAttributeView(type: string, component: AttributeTypeDefinition)
	{
		this.defaultTypeAttributeView[type] = component;
	}

	/**
	 * 获取对象界面
	 * @param object 用于生成界面的对象
	 * @param param 参数
	 */
	getObjectView(object: object, param?: GetObjectViewParam): IObjectView
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
		const view = new Cls(classConfig) as IObjectView;

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
		const view = new Cls(attributeViewInfo) as IObjectAttributeView;

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
		const view = new Cls(blockViewInfo) as IObjectBlockView;

		return view;
	}

	addOAV(target: object, propertyKey: string, param?: OAVComponentParams)
	{
		const proto = target as Record<PropertyKey, unknown>;
		if (!Object.getOwnPropertyDescriptor(target, objectviewKey)) { proto[objectviewKey] = {}; }
		const objectview = (proto[objectviewKey] as ClassDefinition) || ({} as ClassDefinition);
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
	getObjectInfo(object: object, autocreate = true, excludeAttrs: string[] = []): ObjectViewInfo
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

		let classConfig = getInheritClassDefinition(object, autocreate, this.dataTypeSchema, this.objectViewConfig);

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
				// 只有「字段确实已经存在」时才看它是不是只读访问器（getter 无 setter）。
				// 描述表声明的字段是**类型上存在**，纯数据范式里可选字段常常根本没写
				// （缺失时由 Logic 兜底）——此时它在对象上不存在，但应当可编辑：
				// 写入会把它落到数据上（经响应式代理，§11.3），而不是被误判成只读
				if (propertyExists(object, attributeDefinition.name))
				{
					editable = editable && propertyIsWritable(object, attributeDefinition.name);
				}

				const ownerRecord = object as Record<string, unknown>;
				const obj: AttributeViewInfo = Object.assign(
					{
						owner: object,
						type: getAttributeType(ownerRecord[attributeDefinition.name]),
						name: attributeDefinition.name,
						editable: true,
					},
					attributeDefinition,
				);
				obj.editable = editable;
				objectAttributeInfos.push(obj);
			}
		});

		function getAttributeType(attribute: unknown): string
		{
			if (objectIsEmpty(attribute))
			{
				return 'null';
			}
			if (typeof attribute === 'number')
			{
				return 'number';
			}

			return (attribute as object).constructor.name;
		}

		objectAttributeInfos.forEach((v, i) => { (v as unknown as Record<string, unknown>)[tempIKey] = i; });
		objectAttributeInfos.sort((a, b) =>
			((a.priority || 0) - (b.priority || 0)) || (((a as unknown as Record<string, number>)[tempIKey]) - ((b as unknown as Record<string, number>)[tempIKey])));
		objectAttributeInfos.forEach((v) => { delete (v as unknown as Record<string, unknown>)[tempIKey]; });

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
				const attributeDefinition: AttributeDefinition = Object.assign({}, newAttributeDefinition);
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
				const blockDefinition: BlockDefinition = Object.assign({}, newBlockDefinition);
				oldClassDefinition.blockDefinitionVec.push(blockDefinition);
			}
		});
	}
}

function getInheritClassDefinition(
	object: object,
	autocreate = true,
	dataTypeSchema?: DataTypeSchema,
	objectViewConfig?: ObjectViewConfigMap,
)
{
	const classConfigVec: ClassDefinition[] = [];
	let prototype: object | null = object;
	while (prototype)
	{
		const protoRecord = prototype as Record<PropertyKey, unknown>;
		const classConfig = protoRecord[objectviewKey] as ClassDefinition;
		if (classConfig) { classConfigVec.push(classConfig); }
		prototype = (protoRecord[protoKey] as object | null) || null;
	}
	let resultclassConfig: ClassDefinition;
	if (classConfigVec.length > 0)
	{
		resultclassConfig = {
			component: '',
			attributeDefinitionVec: [],
			blockDefinitionVec: [],
		};
		for (let i = classConfigVec.length - 1; i >= 0; i--)
		{
			mergeClassDefinition(resultclassConfig, classConfigVec[i]);
		}
	}
	else
	{
		// 原型链上没有任何 @oav 元数据——纯数据对象都走这里（原型是 Object.prototype）。
		// 两级发现，顺序不能反：
		//   1. 字段描述表（来自 TypeScript 类型）：字段清单与"有没有赋过值"无关，
		//      所以 `{ __type__: 'PerspectiveCamera' }` 这种裸字面量也能列出全部字段，
		//      控件也由类型决定而不会退化；
		//   2. 兜底：对象上**实际存在**的字段。类型只能由运行时值推断
		//      （`{x,y,z}` 会得到普通对象而不是 Vector3），这是兜底的固有天花板。
		resultclassConfig = getDataTypeClassConfig(object, dataTypeSchema, objectViewConfig)
			|| (autocreate ? getDefaultClassConfig(object) : undefined);
	}

	return resultclassConfig;
}

/**
 * 用注册的字段描述表 + 人工配置构造类定义。
 *
 * 两级来源各司其职：
 * - **描述表**（由生成器从 TypeScript 类型产出）：字段清单与控件种类——能从类型推出来的东西；
 * - **配置**（人工维护，key 为 `__type__`）：对象级视图控件、**分组**、显示名、范围/步长等
 *   ——需要人来定的东西。配置还能追加描述表里没有的字段。
 *
 * @param object 待显示对象
 * @param dataTypeSchema `__type__` → 字段清单（未注册时为 undefined）
 * @param objectViewConfig `__type__` → 对象/分组/字段配置（未注册时为 undefined）
 * @returns 命中描述表或配置时返回类定义，否则返回 undefined（由调用方走兜底）
 */
function getDataTypeClassConfig(
	object: object,
	dataTypeSchema?: DataTypeSchema,
	objectViewConfig?: ObjectViewConfigMap,
): ClassDefinition | undefined
{
	const typeName = (object as { __type__?: unknown }).__type__;
	if (typeof typeName !== 'string') return undefined;

	const fields = dataTypeSchema?.[typeName];
	const config = objectViewConfig?.[typeName];
	if ((!fields || fields.length === 0) && !config) return undefined;

	const attributeDefinitionVec: AttributeDefinition[] = [];

	for (const field of fields ?? [])
	{
		// 数字枚举是位标志（`1 << 0` 之类），用下拉单选表达它是错的 → 只读展示
		const readonlyEnum = field.numeric === true;
		const componentParam: Record<string, unknown> = {};
		if (field.numericValues)
		{
			// 普通数字枚举：候选项显示成员名，写回的是数值
			componentParam.enumClass = field.numericValues;
		}
		else if (field.values && !readonlyEnum)
		{
			// OAVEnum 收 `enumClass` 并 `for (const key in ...)` 展开成候选项，
			// 因此字符串值直接自映射即可（见 useOAVEnum.ts）
			componentParam.enumClass = Object.fromEntries(field.values.map((value) => [value, value]));
		}
		if (field.typeNames) componentParam.typeNames = field.typeNames;

		const definition: AttributeDefinition = {
			name: field.name,
			// 声明类型优先于"从运行时值推断"——这正是描述表的意义所在
			type: field.control,
			block: '',
			...(readonlyEnum ? { editable: false } : {}),
			...(Object.keys(componentParam).length > 0 ? { componentParam } : {}),
			...(field.type ? { tooltip: field.type } : {}),
		};
		applyAttributeConfig(definition, config?.attributes?.[field.name]);
		attributeDefinitionVec.push(definition);
	}

	// 配置里声明、描述表里没有的字段（例如面板上的动作按钮）：追加在后面，保持配置里的书写顺序
	for (const [name, attributeConfig] of Object.entries(config?.attributes ?? {}))
	{
		if (attributeDefinitionVec.some((definition) => definition.name === name)) continue;

		const definition: AttributeDefinition = { name, type: 'Default', block: '' };
		applyAttributeConfig(definition, attributeConfig);
		attributeDefinitionVec.push(definition);
	}

	return {
		// 对象级视图控件（代替原先挂在 class 上的 `@OVComponent`）
		component: config?.view ?? '',
		...(config?.viewParam !== undefined ? { componentParam: config.viewParam } : {}),
		attributeDefinitionVec,
		blockDefinitionVec: config?.blocks ? config.blocks.map((block) => ({ ...block })) : [],
	};
}

/**
 * 把人工配置合并到字段定义上。
 *
 * 配置项**优先于**描述表推导出来的值：类型能推出"该用什么控件"，但推不出
 * "这项该叫什么名字、属于哪个分组、取值范围是多少"。
 *
 * @param definition 待覆盖的字段定义
 * @param config 该字段的人工配置（未配置时为 undefined）
 */
function applyAttributeConfig(definition: AttributeDefinition, config?: ObjectViewAttributeConfig): void
{
	if (!config) return;

	if (config.type !== undefined) definition.type = config.type;
	if (config.component !== undefined) definition.component = config.component;
	if (config.componentParam !== undefined) definition.componentParam = config.componentParam;
	if (config.label !== undefined) definition.label = config.label;
	if (config.block !== undefined) definition.block = config.block;
	if (config.tooltip !== undefined) definition.tooltip = config.tooltip;
	if (config.priority !== undefined) definition.priority = config.priority;
	if (config.editable !== undefined) definition.editable = config.editable;
	if (config.exclude !== undefined) definition.exclude = config.exclude;
}

function getDefaultClassConfig(object: object, filterReg = /(([a-zA-Z0-9])+|(\d+))/)
{
	const objectRecord = object as Record<string, unknown>;
	let attributeNames: string[] = [];
	for (const key in object)
	{
		const result = filterReg.exec(key);
		if (result && result[0] === key)
		{
			const value = objectRecord[key];
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
function getObjectBlockInfos(object: object, objectAttributeInfos: AttributeViewInfo[], blockDefinitionVec?: BlockDefinition[]): BlockViewInfo[]
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
	const pushDic: Record<string, boolean> = {};

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
		 * 枚举类型（构造函数或枚举对象）
		 */
		enumClass: object,
	}
}

export interface OBVComponentParamMap
{
	块组件名称: '块组件参数';
	[component: string]: unknown;
}

export interface OVComponentParamMap
{
	类组件名称: '类组件参数';
	[component: string]: unknown;
}

/**
 * 单个纯数据字段的描述（由上层注入，见 {@link ObjectView.setDataTypeSchema}）。
 *
 * 为什么字段清单要外部给：纯数据对象上只有**用户显式写过的**字段，
 * `{ __type__: 'PerspectiveCamera' }` 的 `Object.keys` 就只有一个 `__type__`；
 * 工厂不补默认值、Logic 的 getter 又全是计算型的。字段清单只存在于 TypeScript 类型里，
 * 而 interface 编译后完全消失——所以只能由能读到类型的一方（生成器）提供。
 */
export interface DataTypeFieldDefinition
{
	/** 字段名 */
	name: string;

	/** 控件种类：与 `setDefaultTypeAttributeView(type, ...)` 的注册名一致 */
	control: string;

	/** 类型上是可选字段 */
	optional?: boolean;

	/** 类型上是只读字段（纯数据接口里被响应式追踪的字段一律 readonly，§8.5） */
	readonly?: boolean;

	/** `control === 'Enum'` 时的候选值 */
	values?: readonly string[];

	/**
	 * 普通数字枚举的 `成员名 → 数值` 映射（存在时控件要写回数值）。
	 *
	 * 与 {@link numeric} 互斥：那个表示"位标志、只读展示"。
	 */
	numericValues?: Readonly<Record<string, number>>;

	/**
	 * 该枚举是**位标志**（成员值不连续，如 `1 << 0` / `1 << 1` / `(1 << 8) - 1`）。
	 *
	 * 可以用位或组合，用下拉单选表达它是错的，因此按只读展示处理。
	 */
	numeric?: boolean;

	/** `control === 'Object'` 且是 `__type__` 联合时，可选的类型名列表 */
	typeNames?: readonly string[];

	/** `control === 'Array'` 时元素的控件种类 */
	itemControl?: string;

	/** TS 类型原文（作为提示信息显示） */
	type?: string;
}

/** `__type__` → 该类型的字段清单 */
export type DataTypeSchema = Record<string, readonly DataTypeFieldDefinition[]>;

/**
 * 单个字段的人工配置。
 *
 * 描述表回答"有哪些字段、各用什么控件"（能从类型推出来）；这里回答"它叫什么名字、
 * 属于哪个分组、取值范围多少"（推不出来，得人来定）。
 */
export interface ObjectViewAttributeConfig
{
	/**
	 * 覆盖**控件种类**（走 `setDefaultTypeAttributeView` 的注册表，如 `number` / `Boolean` / `Vector3`）。
	 *
	 * 常见用途是把某个字段换个控件：例如把只读展示的字段改成可编辑的下拉。
	 */
	type?: string;

	/** 直接指定 OAV 控件名（`OAVNumber` 这类，绕过类型注册表） */
	component?: string;

	/** 控件参数（如 OAVNumber 的 `minValue` / `maxValue` / `step`） */
	componentParam?: unknown;

	/** 显示名（面板上看到的标签，缺省用字段名） */
	label?: string;

	/** 所属分组名（对应 {@link ObjectViewTypeConfig.blocks} 里的项） */
	block?: string;

	/** 提示信息 */
	tooltip?: string;

	/** 排序权重，数字越小越靠前 */
	priority?: number;

	/** 是否可编辑 */
	editable?: boolean;

	/** 是否从面板排除 */
	exclude?: boolean;
}

/** 分组定义（决定面板上的分节标题与顺序） */
export interface ObjectViewBlockConfig
{
	/** 分组名（空字符串表示不分组的那一节） */
	name: string;

	/** 该分组的块视图控件（缺省用 defaultObjectAttributeBlockView） */
	component?: string;

	/** 块视图控件参数 */
	componentParam?: unknown;
}

/**
 * 单个 `__type__` 的人工配置。
 *
 * 这是原先挂在 class 上的那些装饰器（`@OVComponent` / `@oav(分组、显示名…)`）的**替代品**：
 * 数据侧不再需要装饰器，视图侧改为按 `__type__` 查配置。配置与生成出来的字段描述表
 * 在查询时合并——描述表管字段清单与控件种类，配置管视图、分组与显示细节。
 */
export interface ObjectViewTypeConfig
{
	/** 对象级视图控件名（代替 `@OVComponent()`） */
	view?: string;

	/** 对象级视图控件参数 */
	viewParam?: unknown;

	/** 分组定义与顺序 */
	blocks?: readonly ObjectViewBlockConfig[];

	/**
	 * 字段配置：既用于覆盖描述表推出来的字段，也可声明描述表里没有的字段
	 * （追加字段按本对象的键序排在描述表字段之后）。
	 */
	attributes?: Record<string, ObjectViewAttributeConfig>;
}

/** `__type__` → 该类型的对象/分组/字段配置 */
export type ObjectViewConfigMap = Record<string, ObjectViewTypeConfig>;

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
	 * 属性类型（控件种类的声明值）。
	 *
	 * 由字段描述表给出时优先于「从运行时值推断的类型」——纯数据对象的字段常常根本没赋值，
	 * 从值推断只能得到 `undefined`，控件会退化成默认视图。见 {@link DataTypeFieldDefinition}。
	 */
	type?: string;

	/**
	 * 显示名（面板上的标签）。
	 *
	 * 缺省由控件用字段名推导（`castShadows` → `Cast Shadows`），配了就用配置里的
	 * （例如中文显示名）。
	 */
	label?: string;

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
	componentParam?: unknown;

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
	componentParam?: unknown;
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
	componentParam?: unknown;
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
	componentParam?: unknown;

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
	space: unknown;

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
	attributeValue: unknown;

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
	space: unknown;

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
	space: unknown;

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
	 * 显示名（面板上的标签）
	 */
	label?: string;

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
	componentParam?: unknown;

	/**
	 * 属性所属对象
	 */
	owner: object;

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
	componentParam?: unknown;

	/**
	 * 属性信息列表
	 */
	itemList: AttributeViewInfo[];

	/**
	 * 属性拥有者
	 */
	owner: object;
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
	componentParam?: unknown;

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
	owner: unknown;

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
function propertyIsWritable(obj: object, property: string): boolean
{
	const data = getPropertyDescriptor(obj, property);
	if (!data) return false;
	if (data.get && !data.set) return false;

	return true;
}

/**
 * 属性在对象自身或其原型链上是否存在。
 *
 * 与 {@link propertyIsWritable} 的区别：那个函数对"不存在"也返回 false，
 * 而这里要区分"不存在（类型上声明了但没赋值）"与"存在但是只读访问器"。
 *
 * @param obj 对象
 * @param property 属性名称
 */
function propertyExists(obj: object, property: string): boolean
{
	return getPropertyDescriptor(obj, property) !== undefined;
}

/**
 * 从对象自身或者对象的原型中获取属性描述
 *
 * @param object 对象
 * @param property 属性名称
 */
function getPropertyDescriptor(object: object, property: string): PropertyDescriptor | undefined
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
function objectIsEmpty(obj: unknown): boolean
{
	if (obj === undefined || obj === null)
	{ return true; }

	return false;
}
