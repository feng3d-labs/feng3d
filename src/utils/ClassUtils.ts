module feng3d
{
    /**
     * 类工具
     * @author feng 2017-02-15
     */
    export class ClassUtils
    {
        /**
         * 判断a对象是否为b类型
         */
        public static is<T>(a, b: new () => T): boolean
        {
            var prototype: any = a.prototype ? a.prototype : Object.getPrototypeOf(a);
            while (prototype != null)
            {
                //类型==自身原型的构造函数
                if (prototype.constructor == b)
                    return true;
                //父类就是原型的原型构造函数
                prototype = Object.getPrototypeOf(prototype);
            }

            return false;
        }

        /**
         * 如果a为b类型则返回，否则返回null
         */
        public static as<T>(a, b: new () => T): T
        {
            if (!ClassUtils.is(a, b))
                return null;
            return <T>a;
        }

        /**
         * 是否为基础类型
         * @param object    对象  
         */
        public static isBaseType(object: any)
        {
            return object == null || typeof object == "number" || typeof object == "boolean" || typeof object == "string";
        }

        /**
         * 返回对象的完全限定类名。
         * @param value 需要完全限定类名称的对象，可以将任何 JavaScript 值传递给此方法，包括所有可用的 JavaScript 类型、对象实例、原始类型
         * （如number)和类对象
         * @returns 包含完全限定类名称的字符串。
         */
        public static getQualifiedClassName(value: any): string
        {
            if (value == null)
            {
                return null;
            }
            var className: string = null;
            var prototype: any = value.prototype ? value.prototype : Object.getPrototypeOf(value);
            if (prototype.hasOwnProperty(_CLASS_KEY))
            {
                className = prototype[_CLASS_KEY];
            }
            if (className == null)
            {
                className = prototype.constructor.name;
                if (ClassUtils.getDefinitionByName(className) == prototype.constructor)
                {
                    ClassUtils.registerClass(prototype.constructor, className);
                } else
                {
                    //在可能的命名空间内查找
                    for (var i = 0; i < _classNameSpaces.length; i++)
                    {
                        var tryClassName = _classNameSpaces[i] + "." + className;
                        if (ClassUtils.getDefinitionByName(tryClassName) == prototype.constructor)
                        {
                            className = tryClassName;
                            ClassUtils.registerClass(prototype.constructor, className);
                            break;
                        }
                    }
                }
            }

            debuger && assert(ClassUtils.getDefinitionByName(className) == prototype.constructor);
            return className;
        }

        /**
         * 获取父类定义
         */
        public static getSuperClass(value: any): any
        {
            return value && value["__proto__"];
        }

        /**
         * 返回 value 参数指定的对象的基类的完全限定类名。
         * @param value 需要取得父类的对象，可以将任何 JavaScript 值传递给此方法，包括所有可用的 JavaScript 类型、对象实例、原始类型（如number）和类对象
         * @returns 完全限定的基类名称，或 null（如果不存在基类名称）。
         */
        public static getQualifiedSuperclassName(value: any): string
        {
            if (value == null)
            {
                return null;
            }
            var prototype: any = value.prototype ? value.prototype : Object.getPrototypeOf(value);
            var superProto = Object.getPrototypeOf(prototype);
            if (!superProto)
            {
                return null;
            }
            var superClass = ClassUtils.getQualifiedClassName(superProto.constructor);
            if (!superClass)
            {
                return null;
            }
            return superClass;
        }

        /**
         * 返回 name 参数指定的类的类对象引用。
         * @param name 类的名称。
         */
        public static getDefinitionByName(name: string): any
        {
            if (!name)
                return null;
            var definition = _definitionCache[name];
            if (definition)
            {
                return definition;
            }
            var paths = name.split(".");
            var length = paths.length;
            definition = _global;
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

        /**
         * 为一个类定义注册完全限定类名
         * @param classDefinition 类定义
         * @param className 完全限定类名
         */
        public static registerClass(classDefinition: any, className: string): void
        {
            var prototype = classDefinition.prototype;
            Object.defineProperty(prototype, _CLASS_KEY, {
                value: className,
                enumerable: false,
                writable: true
            });
        }

        /**
         * 新增反射对象所在的命名空间，使得getQualifiedClassName能够得到正确的结果
         */
        public static addClassNameSpace(namespace: string)
        {
            if (_classNameSpaces.indexOf(namespace) == -1)
            {
                _classNameSpaces.push(namespace);
            }
        }
    }

    var _definitionCache = {};
    var _global = window;
    var _CLASS_KEY = "__class__";
    var _classNameSpaces = ["feng3d"];
}