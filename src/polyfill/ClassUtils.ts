namespace feng3d
{
    export var __class__ = "__class__";

    /**
     * 类工具
     */
    export var classUtils: ClassUtils;

    /**
     * 类工具
     */
    export class ClassUtils
    {
        classUtilsHandlers: Function[] = [];

        /**
         * 返回对象的完全限定类名。
         * @param value 需要完全限定类名称的对象，可以将任何 JavaScript 值传递给此方法，包括所有可用的 JavaScript 类型、对象实例、原始类型
         * （如number)和类对象
         * @returns 包含完全限定类名称的字符串。
         */
        getQualifiedClassName(value: any): string
        {
            if (value == null)
                return "null";

            const classUtilsHandlers = classUtils.classUtilsHandlers;
            if (classUtilsHandlers)
            {
                classUtilsHandlers.forEach(element =>
                {
                    element(value);
                });
            }

            var prototype: any = value.prototype ? value.prototype : Object.getPrototypeOf(value);
            if (prototype.hasOwnProperty(__class__))
                return prototype[__class__];

            var className: string = prototype.constructor.name;
            if (_global[className] == prototype.constructor)
                return className;
            //在可能的命名空间内查找
            for (var i = 0; i < _classNameSpaces.length; i++)
            {
                var tryClassName = _classNameSpaces[i] + "." + className;
                if (this.getDefinitionByName(tryClassName) == prototype.constructor)
                {
                    className = tryClassName;
                    registerClass(prototype.constructor, className);
                    return className;
                }
            }
            console.warn(`未在给出的命名空间 ${_classNameSpaces} 内找到 ${value}-${className} 的定义`);
            return className;
        }

        /**
         * 返回 name 参数指定的类的类对象引用。
         * @param name 类的名称。
         */
        getDefinitionByName(name: string, readCache = true): any
        {
            if (name == "null")
                return null;
            if (!name)
                return null;
            if (_global[name])
                return _global[name];
            if (readCache && _definitionCache[name])
                return _definitionCache[name];

            var paths = name.split(".");
            var length = paths.length;
            var definition = _global;
            for (var i = 0; i < length; i++)
            {
                var path = paths[i];
                definition = definition[path];
                if (!definition)
                {
                    return null;
                }
            }
            _definitionCache[name] = definition;
            return definition;
        }

        private defaultInstMap: { [className: string]: any } = {};

        /**
         * 获取默认实例
         * 
         * @param name 类名称
         */
        getDefaultInstanceByName(name: string)
        {
            if (name === undefined)
            {
                return null;
            }

            var defaultInst = this.defaultInstMap[name];
            if (defaultInst) return defaultInst;
            //
            defaultInst = this.defaultInstMap[name] = this.getInstanceByName(name);

            // 冻结对象，防止被修改
            Object.freeze(defaultInst);

            return defaultInst;
        }

        /**
         * 获取实例
         * 
         * @param name 类名称
         */
        getInstanceByName(name: string)
        {
            var cls = this.getDefinitionByName(name);
            console.assert(cls, `无法获取名称为 ${name} 的实例!`);
            var instance = this.getInstanceByDefinition(cls);
            return instance;
        }

        getInstanceByDefinition(cls: any)
        {
            console.assert(cls);
            if (!cls) return undefined;
            if (cls["__create__"])
            {
                return cls["__create__"]();
            }
            return new cls();
        }

        /**
         * 新增反射对象所在的命名空间，使得getQualifiedClassName能够得到正确的结果
         */
        addClassNameSpace(namespace: string)
        {
            if (_classNameSpaces.indexOf(namespace) == -1)
            {
                _classNameSpaces.push(namespace);
            }
        }
    };

    classUtils = new ClassUtils();

    var _definitionCache = {};
    var _global: Window;
    var global: any;
    if (typeof window != "undefined")
    {
        _global = window;
    } else if (typeof global != "undefined")
    {
        _global = <any>global;
    }

    var _classNameSpaces = ["feng3d"];


    /**
     * 为一个类定义注册完全限定类名
     * @param classDefinition 类定义
     * @param className 完全限定类名
     */
    export function registerClass(classDefinition: any, className: string): void
    {
        var prototype = classDefinition.prototype;
        Object.defineProperty(prototype, __class__, { value: className, writable: true, enumerable: false });
    }
}