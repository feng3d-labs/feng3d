module feng3d {

    /**
     * 判断a对象是否为b类型
     */
    export function is(a, b: Function): boolean {

        var prototype: any = a.prototype ? a.prototype : Object.getPrototypeOf(a);
        while (prototype != null) {
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
    export function as(a, b: Function) {
        if (!is(a, b))
            return null;
        return <any>a;
    }

    /**
     * 获取对象UID
     * @author feng 2016-05-08
     */
    export function getUID(object: { __uid__?: string }) {

        //uid属性名称
        var uidKey = "__uid__";

        if (typeof object != "object") {
            throw `无法获取${object}的UID`;
        }

        if (object.hasOwnProperty(uidKey)) {
            return object[uidKey];
        }
        var uid = createUID(object);
        Object.defineProperty(object, uidKey, {
            value: uid,
            enumerable: false,
            writable: false
        });
        return uid;

        /**
         * 创建对象的UID
         * @param object 对象
         */
        function createUID(object: any) {

            var className = getClassName(object);
            var id = ~~uidStart[className];
            var time = Date.now();//时间戳
            var uid = [//
                className,//类名
                StringUtils.getString(~~uidStart[className], 8, "0", false),//类id
                time,//时间戳
            ].join("-");
            //
            $uidDetails[uid] = { className: className, id: id, time: time };
            uidStart[className] = ~~uidStart[className] + 1;
            return uid;
        }
    }

    /**
     * uid自增长编号
     */
    var uidStart: { [className: string]: number } = {};
    /**
     * uid细节
     */
    export var $uidDetails: { [uid: string]: { className: string, id: number, time: number } } = {};

    /**
     * 获取对象的类名
     * @author feng 2016-4-24
     */
    export function getClassName(value: any): string {
        var prototype: any = value.prototype ? value.prototype : Object.getPrototypeOf(value);
        var className: string = prototype.constructor.name;
        return className;
    }

    /**
     * 是否为基础类型
     * @param object    对象  
     */
    export function isBaseType(object: any) {
        return typeof object == "number" || typeof object == "boolean" || typeof object == "string";
    }

    /**
     * 深克隆
     * @param source        源数据
     * @returns             克隆数据
     */
    export function deepClone<T>(source: T): T {
        if (isBaseType(source))
            return source;
        var prototype: any = source["prototype"] ? source["prototype"] : Object.getPrototypeOf(source);
        var target = new prototype.constructor();
        for (var attribute in source) {
            target[attribute] = deepClone(source[attribute]);
        }
        return target;
    }

    /**
     * （浅）克隆
     * @param source        源数据
     * @returns             克隆数据
     */
    export function clone<T>(source: T): T {
        if (isBaseType(source))
            return source;
        var prototype: any = source["prototype"] ? source["prototype"] : Object.getPrototypeOf(source);
        var target = new prototype.constructor();
        for (var attribute in source) {
            target[attribute] = source[attribute];
        }
        return target;
    }

    /**
     * （浅）拷贝数据
     */
    export function copy(target: Object, source: Object) {

        var keys = Object.keys(source);
        keys.forEach(element => {
            target[element] = source[element];
        });
    }

    /**
     * 深拷贝数据
     */
    export function deepCopy(target: Object, source: Object) {

        var keys = Object.keys(source);
        keys.forEach(element => {
            if (!source[element] || isBaseType(source[element])) {
                target[element] = source[element];
            }
            else if (!target[element]) {
                target[element] = deepClone(source[element]);
            }
            else {
                copy(target[element], source[element]);
            }
        });
    }

    /**
     * 合并数据
     * @param source        源数据
     * @param mergeData     合并数据
     * @param createNew     是否合并为新对象，默认为false
     * @returns             如果createNew为true时返回新对象，否则返回源数据
     */
    export function merge<T>(source: T, mergeData: Object, createNew = false): T {

        if (isBaseType(mergeData))
            return <any>mergeData;
        var target = createNew ? clone(source) : source;
        for (var mergeAttribute in mergeData) {
            target[mergeAttribute] = merge(source[mergeAttribute], mergeData[mergeAttribute], createNew);
        }
        return target;
    }

    /**
     * 观察对象
     * @param object        被观察的对象
     * @param onChanged     属性值变化回调函数
     */
    export function watchObject(object: any, onChanged: (object: any, attribute: string, oldValue: any, newValue: any) => void = null) {

        if (isBaseType(object))
            return;
        for (var key in object) {
            watch(object, key, onChanged);
        }
    }

    /**
     * 观察对象中属性
     * @param object        被观察的对象
     * @param attribute     被观察的属性
     * @param onChanged     属性值变化回调函数
     */
    export function watch(object: any, attribute: string, onChanged: (object: any, attribute: string, oldValue: any, newValue: any) => void = null) {

        if (isBaseType(object))
            return;
        if (!object.orig) {
            Object.defineProperty(object, "orig", {
                value: {},
                enumerable: false,
                writable: false,
                configurable: true
            });
        }
        object.orig[attribute] = object[attribute];
        Object.defineProperty(object, attribute, {
            get: function () {
                return this.orig[attribute];
            },
            set: function (value) {
                if (onChanged) {
                    onChanged(this, attribute, this.orig[attribute], value);
                }
                this.orig[attribute] = value;
            }
        });
    }

    /**
     * 取消观察对象
     * @param object        被观察的对象
     */
    export function unwatchObject(object: any) {

        if (isBaseType(object))
            return;
        if (!object.orig)
            return;
        for (var key in object.orig) {
            unwatch(object, key);
        }
        delete object.orig;
    }

    /**
     * 取消观察对象中属性
     * @param object        被观察的对象
     * @param attribute     被观察的属性
     */
    export function unwatch(object: any, attribute: string) {

        if (isBaseType(object))
            return;
        Object.defineProperty(object, attribute, {
            value: object.orig[attribute],
            enumerable: true,
            writable: true
        });
    }
}