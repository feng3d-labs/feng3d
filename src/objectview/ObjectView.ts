module feng3d
{
	export interface OVAComponent
	{
		属性组件名称: "属性组件参数"
	}

	export interface OVBComponent
	{
		块组件名称: "块组件参数"
	}

	export interface OVComponent
	{
		类组件名称: "类组件参数"
	}

	/**
	 * objectview类装饰器
	 */
	export function ov<K extends keyof OVComponent>(param: { component?: K; componentParam?: OVComponent[K]; })
	{
		return (constructor: Function) =>
		{
			var className = ClassUtils.getQualifiedClassName(constructor);
			mergeConfig(objectview.config, {
				classConfigVec: [{
					name: className,
					component: param.component,
					componentParam: param.componentParam,
				}]
			});
		}
	}

	/**
	 * objectview类装饰器
	 */
	export function ovb<K extends keyof OVBComponent>(param: { name: string; component?: K; componentParam?: OVBComponent[K]; })
	{
		return (constructor: Function) =>
		{
			var className = ClassUtils.getQualifiedClassName(constructor);
			mergeConfig(objectview.config, {
				classConfigVec: [{
					name: className,
					blockDefinitionVec: [{
						name: param.name,
						component: param.component,
						componentParam: param.componentParam,
					}]
				}]
			});
		}
	}

	/**
	 * objectview属性装饰器
	 * @param param 参数
	 */
	export function ova<K extends keyof OVAComponent>(param?: { block?: string; component?: K; componentParam?: OVAComponent[K]; })
	{
		return (target: any, propertyKey: string) =>
		{
			var className = ClassUtils.getQualifiedClassName(target);
			mergeConfig(objectview.config, {
				classConfigVec: [{
					name: className,
					attributeDefinitionVec: [{
						name: propertyKey, block: param && param.block, component: param && param.component, componentParam: param && param.componentParam
					}]
				}]
			});
		}
	}

	/**
	 * 对象界面
	 * @author feng 2016-3-10
	 */
	export var objectview: ObjectView = {
		getObjectView: getObjectView,
		getAttributeView: getAttributeView,
		getBlockView: getBlockView,
		mergeConfig: function (config)
		{
			mergeConfig(this.config, config)
		},
		config: defaultconfig(),
	}

	function mergeConfig(oldObjectViewConfig: ObjectViewConfig, newObjectViewConfig: ObjectViewConfig)
	{
		if (newObjectViewConfig.defaultBaseObjectViewClass && newObjectViewConfig.defaultBaseObjectViewClass.length > 0)
			oldObjectViewConfig.defaultBaseObjectViewClass = newObjectViewConfig.defaultBaseObjectViewClass;

		if (newObjectViewConfig.defaultObjectViewClass && newObjectViewConfig.defaultObjectViewClass.length > 0)
			oldObjectViewConfig.defaultObjectViewClass = newObjectViewConfig.defaultObjectViewClass;

		if (newObjectViewConfig.defaultObjectAttributeViewClass && newObjectViewConfig.defaultObjectAttributeViewClass.length > 0)
			oldObjectViewConfig.defaultObjectAttributeViewClass = newObjectViewConfig.defaultObjectAttributeViewClass;

		if (newObjectViewConfig.defaultObjectAttributeViewClass && newObjectViewConfig.defaultObjectAttributeViewClass.length > 0)
			oldObjectViewConfig.defaultObjectAttributeBlockView = newObjectViewConfig.defaultObjectAttributeBlockView;

		//合并默认
		oldObjectViewConfig.attributeDefaultViewClassByTypeVec = oldObjectViewConfig.attributeDefaultViewClassByTypeVec || [];
		if (newObjectViewConfig.attributeDefaultViewClassByTypeVec && newObjectViewConfig.attributeDefaultViewClassByTypeVec.length > 0)
		{
			newObjectViewConfig.attributeDefaultViewClassByTypeVec.forEach(newAttributeDefaultViewClassByType =>
			{
				oldObjectViewConfig.attributeDefaultViewClassByTypeVec.forEach(oldAttributeDefaultViewClassByType =>
				{
					if (newAttributeDefaultViewClassByType && newAttributeDefaultViewClassByType.type == oldAttributeDefaultViewClassByType.type)
					{
						oldAttributeDefaultViewClassByType.component = newAttributeDefaultViewClassByType.component;
						oldAttributeDefaultViewClassByType.componentParam = newAttributeDefaultViewClassByType.componentParam;
						newAttributeDefaultViewClassByType = null;
					}
				});
				if (newAttributeDefaultViewClassByType)
					oldObjectViewConfig.attributeDefaultViewClassByTypeVec.push(newAttributeDefaultViewClassByType);
			});
		}
		oldObjectViewConfig.classConfigVec = oldObjectViewConfig.classConfigVec || [];
		if (newObjectViewConfig.classConfigVec && newObjectViewConfig.classConfigVec.length > 0)
		{
			newObjectViewConfig.classConfigVec.forEach(newClassConfig =>
			{
				oldObjectViewConfig.classConfigVec.forEach(oldClassConfig =>
				{
					if (newClassConfig && newClassConfig.name == oldClassConfig.name)
					{
						mergeClassDefinition(oldClassConfig, newClassConfig);
						newClassConfig = null;
					}
				});
				if (newClassConfig)
					oldObjectViewConfig.classConfigVec.push(newClassConfig);
			});
		}
	}

	function mergeClassDefinition(oldClassDefinition: ClassDefinition, newClassDefinition: ClassDefinition)
	{
		if (newClassDefinition.name)
		{
			oldClassDefinition.name = newClassDefinition.name;
		}
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
				oldClassDefinition.attributeDefinitionVec.forEach(oldAttributeDefinition =>
				{
					if (newAttributeDefinition && oldAttributeDefinition.name == newAttributeDefinition.name)
					{
						oldAttributeDefinition.block = newAttributeDefinition.block;
						oldAttributeDefinition.component = newAttributeDefinition.component;
						oldAttributeDefinition.componentParam = newAttributeDefinition.componentParam;
						newAttributeDefinition = null;
					}
				});
				if (newAttributeDefinition)
				{
					oldClassDefinition.attributeDefinitionVec.push(newAttributeDefinition);
				}
			});
		}
		//合并块
		oldClassDefinition.blockDefinitionVec = oldClassDefinition.blockDefinitionVec || [];
		if (newClassDefinition.blockDefinitionVec && newClassDefinition.blockDefinitionVec.length > 0)
		{
			newClassDefinition.blockDefinitionVec.forEach(newBlockDefinition =>
			{
				oldClassDefinition.blockDefinitionVec.forEach(oldBlockDefinition =>
				{
					if (newBlockDefinition && newBlockDefinition.name == oldBlockDefinition.name)
					{
						oldBlockDefinition.component = newBlockDefinition.component;
						oldBlockDefinition.componentParam = newBlockDefinition.componentParam;
						newBlockDefinition = null;
					}
				});
				if (newBlockDefinition)
				{
					oldClassDefinition.blockDefinitionVec.push(newBlockDefinition);
				}
			});
		}
	}

	function defaultconfig()
	{
		var config: ObjectViewConfig = {

			defaultBaseObjectViewClass: "",
			defaultObjectViewClass: "",
			defaultObjectAttributeViewClass: "",
			defaultObjectAttributeBlockView: "",
			attributeDefaultViewClassByTypeVec: [],
			classConfigVec: []
		}
		return config;
	}

	/**
	 * 获取对象界面
	 * 
	 * @static
	 * @param {Object} object				用于生成界面的对象
	 * @returns 							对象界面
	 * 
	 * @memberOf ObjectView
	 */
	function getObjectView(object: Object)
	{
		var classConfig = getObjectInfo(object);

		if (classConfig.component == null || classConfig.component == "")
		{
			//返回基础类型界面类定义
			if (!(classConfig.owner instanceof Object))
			{
				classConfig.component = objectview.config.defaultBaseObjectViewClass;
			}
		}
		if (classConfig.component == null || classConfig.component == "")
		{
			//使用默认类型界面类定义
			classConfig.component = objectview.config.defaultObjectViewClass;
		}

		var cls = ClassUtils.getDefinitionByName(classConfig.component);
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
	function getAttributeView(attributeViewInfo: AttributeViewInfo)
	{
		if (attributeViewInfo.component == null || attributeViewInfo.component == "")
		{
			var defaultViewClass = getAttributeDefaultViewClassByType(attributeViewInfo.type);
			var tempComponent = defaultViewClass ? defaultViewClass.component : "";
			if (tempComponent != null && tempComponent != "")
			{
				attributeViewInfo.component = defaultViewClass.component;
				attributeViewInfo.componentParam = defaultViewClass.componentParam;
			}
		}

		if (attributeViewInfo.component == null || attributeViewInfo.component == "")
		{
			//使用默认对象属性界面类定义
			attributeViewInfo.component = objectview.config.defaultObjectAttributeViewClass;
			attributeViewInfo.componentParam = null;
		}

		var cls = ClassUtils.getDefinitionByName(attributeViewInfo.component);
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
	function getBlockView(blockViewInfo: BlockViewInfo)
	{
		if (blockViewInfo.component == null || blockViewInfo.component == "")
		{
			//返回默认对象属性界面类定义
			blockViewInfo.component = objectview.config.defaultObjectAttributeBlockView;
			blockViewInfo.componentParam = null;
		}

		var cls = ClassUtils.getDefinitionByName(blockViewInfo.component);
		var view = new cls(blockViewInfo);
		return view;
	}

	function getAttributeDefaultViewClassByType(type: string)
	{
		var defaultViewClass: AttributeTypeDefinition = null;
		var attributeDefaultViewClassByTypeVec = objectview.config.attributeDefaultViewClassByTypeVec;
		for (var i = 0; i < attributeDefaultViewClassByTypeVec.length; i++)
		{
			if (attributeDefaultViewClassByTypeVec[i].type == type)
			{
				defaultViewClass = attributeDefaultViewClassByTypeVec[i];
				break;
			}
		}
		return defaultViewClass;
	}

	/**
	 * 获取对象信息
	 * @param object
	 * @return
	 */
	function getObjectInfo(object: Object): ObjectViewInfo
	{
		var classConfig: ClassDefinition = getInheritClassDefinition(object);

		var objectAttributeInfos: AttributeViewInfo[] = [];
		classConfig.attributeDefinitionVec.forEach(attributeDefinition =>
		{
			objectAttributeInfos.push(
				{
					name: attributeDefinition.name,
					block: attributeDefinition ? attributeDefinition.block : "",
					component: attributeDefinition ? attributeDefinition.component : "",
					componentParam: attributeDefinition ? attributeDefinition.componentParam : null,
					owner: object,
					writable: true,
					type: ClassUtils.getQualifiedClassName(object[attributeDefinition.name])
				}
			);
		});

		var objectInfo: ObjectViewInfo = {
			objectAttributeInfos: objectAttributeInfos,
			objectBlockInfos: getObjectBlockInfos(object, objectAttributeInfos, classConfig.blockDefinitionVec),
			name: ClassUtils.getQualifiedClassName(object),
			owner: object,
			component: classConfig ? classConfig.component : "",
			componentParam: classConfig ? classConfig.componentParam : null
		};
		return objectInfo;
	}

	function getInheritClassDefinition(object: Object)
	{
		if (object == null || object == Object.prototype)
			return null;

		var classConfigVec: ClassDefinition[] = [];
		while (object)
		{
			var classConfig = getClassDefinition(object);
			if (classConfig)
				classConfigVec.push(classConfig);
			object = ClassUtils.getSuperClass(object);
		}
		var resultclassConfig: ClassDefinition;
		if (classConfigVec.length > 0)
		{
			resultclassConfig = <any>{};
			while (classConfigVec.length > 0)
			{
				mergeClassDefinition(resultclassConfig, classConfigVec.pop());
			}
		} else
		{
			resultclassConfig = getDefaultClassConfig(object);
		}
		return resultclassConfig;
	}

	function getClassDefinition(object: Object)
	{
		if (object == Object.prototype)
			return null;

		var className = ClassUtils.getQualifiedClassName(object);
		var classConfigVec = objectview.config.classConfigVec;
		for (var i = 0; i < classConfigVec.length; i++)
		{
			if (classConfigVec[i].name == className)
			{
				return classConfigVec[i];
			}
		}
		return null;
	}

	function getDefaultClassConfig(object: Object, filterReg = /(([a-zA-Z0-9])+|(\d+))/)
	{
		//
		var attributeNames: string[] = [];
		for (var key in object)
		{
			if (filterReg.exec(key)[0] == key)
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
				block: ""
			});
		});

		var defaultClassConfig: ClassDefinition = {
			name: ClassUtils.getQualifiedClassName(object),
			component: "",
			componentParam: null,
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
			var blockName: string = objectAttributeInfos[i].block;
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
}