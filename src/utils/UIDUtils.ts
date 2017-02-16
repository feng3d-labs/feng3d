module feng3d {

    export class UIDUtils {

        /**
         * 获取对象UID
         * @author feng 2016-05-08
         */
        public static getUID(object: { __uid__?: string }) {

            if (ClassUtils.isBaseType(object)) {
                return object;
            }

            //uid属性名称
            var uidKey = "__uid__";

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

                var className = ClassUtils.getQualifiedClassName(object);
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
    }

    /**
     * uid自增长编号
     */
    var uidStart: { [className: string]: number } = {};
    /**
     * uid细节
     */
    export var $uidDetails: { [uid: string]: { className: string, id: number, time: number } } = {};
}