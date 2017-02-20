module feng3d {

    export class WatchUtils {

        /**
         * 观察对象
         * @param object        被观察的对象
         * @param onChanged     属性值变化回调函数
         */
        public static watchObject(object: any, onChanged: (object: any, attribute: string, oldValue: any, newValue: any) => void = null) {

            if (ClassUtils.isBaseType(object))
                return;
            for (var key in object) {
                WatchUtils.watch(object, key, onChanged);
            }
        }

        /**
         * 观察对象中属性
         * @param object        被观察的对象
         * @param attribute     被观察的属性
         * @param onChanged     属性值变化回调函数
         */
        public static watch(object: any, attribute: string, onChanged: (object: any, attribute: string, oldValue: any, newValue: any) => void = null) {

            if (ClassUtils.isBaseType(object))
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
        public static unwatchObject(object: any) {

            if (ClassUtils.isBaseType(object))
                return;
            if (!object.orig)
                return;
            for (var key in object.orig) {
                WatchUtils.unwatch(object, key);
            }
            delete object.orig;
        }

        /**
         * 取消观察对象中属性
         * @param object        被观察的对象
         * @param attribute     被观察的属性
         */
        public static unwatch(object: any, attribute: string) {

            if (ClassUtils.isBaseType(object))
                return;
            Object.defineProperty(object, attribute, {
                value: object.orig[attribute],
                enumerable: true,
                writable: true
            });
        }
    }
}