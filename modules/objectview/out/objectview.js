var feng3d;
(function (feng3d) {
    /**
     * 标记objectview对象界面类
     */
    function OVComponent(component) {
        return function (constructor) {
            component = component || constructor["name"];
            feng3d.objectview.OVComponent[component] = constructor;
        };
    }
    feng3d.OVComponent = OVComponent;
    /**
     * 标记objectview块界面类
     */
    function OBVComponent(component) {
        return function (constructor) {
            component = component || constructor["name"];
            feng3d.objectview.OBVComponent[component] = constructor;
        };
    }
    feng3d.OBVComponent = OBVComponent;
    /**
     * 标记objectview属性界面类
     */
    function OAVComponent(component) {
        return function (constructor) {
            component = component || constructor["name"];
            feng3d.objectview.OAVComponent[component] = constructor;
        };
    }
    feng3d.OAVComponent = OAVComponent;
    /**
     * objectview类装饰器
     */
    function ov(param) {
        return function (constructor) {
            if (!Object.getOwnPropertyDescriptor(constructor["prototype"], OBJECTVIEW_KEY))
                constructor["prototype"][OBJECTVIEW_KEY] = {};
            var objectview = constructor["prototype"][OBJECTVIEW_KEY];
            objectview.component = param.component;
            objectview.componentParam = param.componentParam;
        };
    }
    feng3d.ov = ov;
    /**
     * objectview属性装饰器
     * @param param 参数
     */
    function oav(param) {
        return function (target, propertyKey) {
            feng3d.objectview.addOAV(target, propertyKey, param);
        };
    }
    feng3d.oav = oav;
    /**
     * 对象界面
     */
    var ObjectView = /** @class */ (function () {
        function ObjectView() {
            /**
             * 默认基础类型对象界面类定义
             */
            this.defaultBaseObjectViewClass = "";
            /**
             * 默认对象界面类定义
             */
            this.defaultObjectViewClass = "";
            /**
             * 默认对象属性界面类定义
             */
            this.defaultObjectAttributeViewClass = "";
            /**
             * 属性块默认界面
             */
            this.defaultObjectAttributeBlockView = "";
            /**
             * 指定属性类型界面类定义字典（key:属性类名称,value:属性界面类定义）
             */
            this.defaultTypeAttributeView = {};
            this.OAVComponent = {};
            this.OBVComponent = {};
            this.OVComponent = {};
        }
        ObjectView.prototype.setDefaultTypeAttributeView = function (type, component) {
            this.defaultTypeAttributeView[type] = component;
        };
        /**
         * 获取对象界面
         * @param object 用于生成界面的对象
         * @param param 参数
         */
        ObjectView.prototype.getObjectView = function (object, param) {
            var p = { autocreate: true, excludeAttrs: [] };
            Object.assign(p, param);
            var classConfig = this.getObjectInfo(object, p.autocreate, p.excludeAttrs);
            classConfig.editable = classConfig.editable == undefined ? true : classConfig.editable;
            Object.assign(classConfig, param);
            // 处理 exclude
            classConfig.objectAttributeInfos = classConfig.objectAttributeInfos.filter(function (v) { return !v.exclude; });
            classConfig.objectBlockInfos.forEach(function (v) {
                v.itemList = v.itemList.filter(function (vv) { return !vv.exclude; });
            });
            classConfig.objectAttributeInfos.forEach(function (v) { v.editable = v.editable && classConfig.editable; });
            if (classConfig.component == null || classConfig.component == "") {
                //返回基础类型界面类定义
                if (!(classConfig.owner instanceof Object)) {
                    classConfig.component = this.defaultBaseObjectViewClass;
                }
                else {
                    //使用默认类型界面类定义
                    classConfig.component = this.defaultObjectViewClass;
                }
            }
            var cls = this.OVComponent[classConfig.component];
            console.assert(cls != null, "\u6CA1\u6709\u5B9A\u4E49 " + classConfig.component + " \u5BF9\u5E94\u7684\u5BF9\u8C61\u754C\u9762\u7C7B\uFF0C\u9700\u8981\u5728 " + classConfig.component + " \u4E2D\u4F7F\u7528@OVComponent()\u6807\u8BB0");
            var view = new cls(classConfig);
            return view;
        };
        /**
         * 获取属性界面
         *
         * @static
         * @param {AttributeViewInfo} attributeViewInfo			属性界面信息
         * @returns {egret.DisplayObject}						属性界面
         *
         * @memberOf ObjectView
         */
        ObjectView.prototype.getAttributeView = function (attributeViewInfo) {
            if (attributeViewInfo.component == null || attributeViewInfo.component == "") {
                var defaultViewClass = this.defaultTypeAttributeView[attributeViewInfo.type];
                var tempComponent = defaultViewClass ? defaultViewClass.component : "";
                if (tempComponent != null && tempComponent != "") {
                    attributeViewInfo.component = defaultViewClass.component;
                    attributeViewInfo.componentParam = defaultViewClass.componentParam || attributeViewInfo.componentParam;
                }
            }
            if (attributeViewInfo.component == null || attributeViewInfo.component == "") {
                //使用默认对象属性界面类定义
                attributeViewInfo.component = this.defaultObjectAttributeViewClass;
            }
            var cls = this.OAVComponent[attributeViewInfo.component];
            console.assert(cls != null, "\u6CA1\u6709\u5B9A\u4E49 " + attributeViewInfo.component + " \u5BF9\u5E94\u7684\u5C5E\u6027\u754C\u9762\u7C7B\uFF0C\u9700\u8981\u5728 " + attributeViewInfo.component + " \u4E2D\u4F7F\u7528@OVAComponent()\u6807\u8BB0");
            var view = new cls(attributeViewInfo);
            return view;
        };
        /**
         * 获取块界面
         *
         * @static
         * @param {BlockViewInfo} blockViewInfo			块界面信息
         * @returns {egret.DisplayObject}				块界面
         *
         * @memberOf ObjectView
         */
        ObjectView.prototype.getBlockView = function (blockViewInfo) {
            if (blockViewInfo.component == null || blockViewInfo.component == "") {
                //返回默认对象属性界面类定义
                blockViewInfo.component = this.defaultObjectAttributeBlockView;
            }
            var cls = this.OBVComponent[blockViewInfo.component];
            console.assert(cls != null, "\u6CA1\u6709\u5B9A\u4E49 " + blockViewInfo.component + " \u5BF9\u5E94\u7684\u5757\u754C\u9762\u7C7B\uFF0C\u9700\u8981\u5728 " + blockViewInfo.component + " \u4E2D\u4F7F\u7528@OVBComponent()\u6807\u8BB0");
            var view = new cls(blockViewInfo);
            return view;
        };
        ObjectView.prototype.addOAV = function (target, propertyKey, param) {
            if (!Object.getOwnPropertyDescriptor(target, OBJECTVIEW_KEY))
                target[OBJECTVIEW_KEY] = {};
            var objectview = target[OBJECTVIEW_KEY] || {};
            var attributeDefinitionVec = objectview.attributeDefinitionVec = objectview.attributeDefinitionVec || [];
            var attributeDefinition = Object.assign({ name: propertyKey }, param);
            attributeDefinitionVec.push(attributeDefinition);
        };
        /**
         * 获取对象信息
         * @param object				对象
         * @param autocreate			当对象没有注册属性时是否自动创建属性信息
         * @param excludeAttrs			排除属性列表
         * @return
         */
        ObjectView.prototype.getObjectInfo = function (object, autocreate, excludeAttrs) {
            if (autocreate === void 0) { autocreate = true; }
            if (excludeAttrs === void 0) { excludeAttrs = []; }
            if (typeof object == "string" || typeof object == "number" || typeof object == "boolean") {
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
            var objectAttributeInfos = [];
            classConfig.attributeDefinitionVec.forEach(function (attributeDefinition) {
                if (excludeAttrs.indexOf(attributeDefinition.name) == -1) {
                    var editable = attributeDefinition.editable == undefined ? true : attributeDefinition.editable;
                    editable = editable && Object.propertyIsWritable(object, attributeDefinition.name);
                    var obj = { owner: object, type: getAttributeType(object[attributeDefinition.name]) };
                    Object.assign(obj, attributeDefinition);
                    obj.editable = editable;
                    objectAttributeInfos.push(obj);
                }
            });
            function getAttributeType(attribute) {
                if (attribute == null)
                    return "null";
                if (typeof attribute == "number")
                    return "number";
                return attribute.constructor.name;
            }
            objectAttributeInfos.forEach(function (v, i) { v["___tempI"] = i; });
            objectAttributeInfos.sort(function (a, b) {
                return ((a.priority || 0) - (b.priority || 0)) || (a["___tempI"] - b["___tempI"]);
            });
            objectAttributeInfos.forEach(function (v, i) { delete v["___tempI"]; });
            var objectInfo = {
                objectAttributeInfos: objectAttributeInfos,
                objectBlockInfos: getObjectBlockInfos(object, objectAttributeInfos, classConfig.blockDefinitionVec),
                owner: object,
                component: classConfig.component,
                componentParam: classConfig.componentParam
            };
            return objectInfo;
        };
        return ObjectView;
    }());
    feng3d.ObjectView = ObjectView;
    feng3d.objectview = new ObjectView();
    var OBJECTVIEW_KEY = "__objectview__";
    function mergeClassDefinition(oldClassDefinition, newClassDefinition) {
        if (newClassDefinition.component && newClassDefinition.component.length > 0) {
            oldClassDefinition.component = newClassDefinition.component;
            oldClassDefinition.componentParam = newClassDefinition.componentParam;
        }
        //合并属性
        oldClassDefinition.attributeDefinitionVec = oldClassDefinition.attributeDefinitionVec || [];
        if (newClassDefinition.attributeDefinitionVec && newClassDefinition.attributeDefinitionVec.length > 0) {
            newClassDefinition.attributeDefinitionVec.forEach(function (newAttributeDefinition) {
                var isfound = false;
                oldClassDefinition.attributeDefinitionVec.forEach(function (oldAttributeDefinition) {
                    if (newAttributeDefinition && oldAttributeDefinition.name == newAttributeDefinition.name) {
                        Object.assign(oldAttributeDefinition, newAttributeDefinition);
                        //
                        var oldIndex = oldClassDefinition.attributeDefinitionVec.indexOf(oldAttributeDefinition);
                        oldClassDefinition.attributeDefinitionVec.splice(oldIndex, 1);
                        //
                        oldClassDefinition.attributeDefinitionVec.push(oldAttributeDefinition);
                        isfound = true;
                    }
                });
                if (!isfound) {
                    var attributeDefinition = {};
                    Object.assign(attributeDefinition, newAttributeDefinition);
                    oldClassDefinition.attributeDefinitionVec.push(attributeDefinition);
                }
            });
        }
        //合并块
        oldClassDefinition.blockDefinitionVec = oldClassDefinition.blockDefinitionVec || [];
        if (newClassDefinition.blockDefinitionVec && newClassDefinition.blockDefinitionVec.length > 0) {
            newClassDefinition.blockDefinitionVec.forEach(function (newBlockDefinition) {
                var isfound = false;
                oldClassDefinition.blockDefinitionVec.forEach(function (oldBlockDefinition) {
                    if (newBlockDefinition && newBlockDefinition.name == oldBlockDefinition.name) {
                        Object.assign(oldBlockDefinition, newBlockDefinition);
                        isfound = true;
                    }
                });
                if (!isfound) {
                    var blockDefinition = {};
                    Object.assign(blockDefinition, newBlockDefinition);
                    oldClassDefinition.blockDefinitionVec.push(blockDefinition);
                }
            });
        }
    }
    function getInheritClassDefinition(object, autocreate) {
        if (autocreate === void 0) { autocreate = true; }
        var classConfigVec = [];
        var prototype = object;
        while (prototype) {
            var classConfig = prototype[OBJECTVIEW_KEY];
            if (classConfig)
                classConfigVec.push(classConfig);
            prototype = prototype["__proto__"];
        }
        var resultclassConfig;
        if (classConfigVec.length > 0) {
            resultclassConfig = {};
            for (var i = classConfigVec.length - 1; i >= 0; i--) {
                mergeClassDefinition(resultclassConfig, classConfigVec[i]);
            }
        }
        else if (autocreate) {
            resultclassConfig = getDefaultClassConfig(object);
        }
        return resultclassConfig;
    }
    function getDefaultClassConfig(object, filterReg) {
        if (filterReg === void 0) { filterReg = /(([a-zA-Z0-9])+|(\d+))/; }
        //
        var attributeNames = [];
        for (var key in object) {
            var result = filterReg.exec(key);
            if (result && result[0] == key) {
                var value = object[key];
                if (value === undefined || value instanceof Function)
                    continue;
                attributeNames.push(key);
            }
        }
        attributeNames = attributeNames.sort();
        var attributeDefinitionVec = [];
        attributeNames.forEach(function (element) {
            attributeDefinitionVec.push({
                name: element,
                block: "",
            });
        });
        var defaultClassConfig = {
            component: "",
            attributeDefinitionVec: attributeDefinitionVec,
            blockDefinitionVec: []
        };
        return defaultClassConfig;
    }
    /**
     * 获取对象块信息列表
     * @param {Object} object			对象
     * @returns {BlockViewInfo[]}		对象块信息列表
     */
    function getObjectBlockInfos(object, objectAttributeInfos, blockDefinitionVec) {
        var objectBlockInfos = [];
        var dic = {};
        var objectBlockInfo;
        //收集块信息
        var i = 0;
        var tempVec = [];
        for (i = 0; i < objectAttributeInfos.length; i++) {
            var blockName = objectAttributeInfos[i].block || "";
            objectBlockInfo = dic[blockName];
            if (objectBlockInfo == null) {
                objectBlockInfo = dic[blockName] = { name: blockName, owner: object, itemList: [] };
                tempVec.push(objectBlockInfo);
            }
            objectBlockInfo.itemList.push(objectAttributeInfos[i]);
        }
        //按快的默认顺序生成 块信息列表
        var blockDefinition;
        var pushDic = {};
        if (blockDefinitionVec) {
            for (i = 0; i < blockDefinitionVec.length; i++) {
                blockDefinition = blockDefinitionVec[i];
                objectBlockInfo = dic[blockDefinition.name];
                if (objectBlockInfo == null) {
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
        for (i = 0; i < tempVec.length; i++) {
            if (Boolean(pushDic[tempVec[i].name]) == false) {
                objectBlockInfos.push(tempVec[i]);
            }
        }
        return objectBlockInfos;
    }
})(feng3d || (feng3d = {}));
//# sourceMappingURL=objectview.js.map