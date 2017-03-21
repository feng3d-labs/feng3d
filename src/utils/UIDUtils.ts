module feng3d
{

    export class UIDUtils
    {

        /**
         * 获取对象UID
         * @author feng 2016-05-08
         */
        public static getUID(object: { __uid__?: string })
        {

            if (ClassUtils.isBaseType(object))
            {
                return object;
            }

            //uid属性名称
            var uidKey = "__uid__";

            if (object.hasOwnProperty(uidKey))
            {
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
            function createUID(object: any)
            {
                var prototype: any = object.prototype ? object.prototype : Object.getPrototypeOf(object);
                var className = object.constructor.name;
                var autoID = ~~object.constructor.autoID;
                object.constructor.autoID = autoID + 1;
                var time = Date.now();//时间戳
                var uid = [//
                    className,//类名
                    StringUtils.getString(autoID, 8, "0", false),//类id
                    time,//时间戳
                ].join("-");
                return uid;
            }
        }
    }
}