declare namespace feng3d {
    /**
     * 默认序列化工具
     */
    export var serialization: Serialization;
    /**
     * 序列化装饰器
     *
     * 在属性定义前使用 @serialize 进行标记需要序列化
     *
     * @param {*} target                序列化原型
     * @param {string} propertyKey      序列化属性
     */
    export function serialize(target: any, propertyKey: string): void;
    /**
     * 序列化属性函数项
     */
    interface PropertyHandler<T extends HandlerParam> {
        /**
         * 序列化属性函数项
         *
         * @param target 序列化后的对象，存放序列化后属性值的对象。
         * @param source 被序列化的对象，提供序列化前属性值的对象。
         * @param property 序列化属性名称
         * @param param 参数列表
         *
         * @returns 返回true时结束该属性后续处理。
         */
        (target: any, source: any, property: string, param: T): boolean;
    }
    interface HandlerParam {
        handlers: PropertyHandler<HandlerParam>[];
        serialization: Serialization;
    }
    interface SerializeHandlerParam extends HandlerParam {
        /**
         * 已经被序列化的列表
         *
         * {key: 被序列化的对象，value：{target:序列化后数据所存储对象,property:序列化后数据所存在属性名称}}
         *
         * 用于处理序列化循环引用以及多次引用的对象
         */
        serializedMap: Map<Object, {
            target: any;
            property: string;
        }>;
        handlers: PropertyHandler<SerializeHandlerParam>[];
        root: object;
        autoRefID: number;
    }
    interface DeserializeHandlerParam extends HandlerParam {
        refs: {
            [refid: string]: {
                target: Object;
                property: string;
                refs: {
                    target: Object;
                    property: string;
                }[];
            };
        };
    }
    interface DifferentHandlerParam extends HandlerParam {
        handlers: PropertyHandler<DifferentHandlerParam>[];
        /**
         * 当前对象的不同数据
         */
        different: Object;
    }
    /**
     * 序列化
     */
    export class Serialization {
        /**
         * 是否忽略默认值
         */
        omitDefault: boolean;
        /**
         * 序列化函数列表
         */
        serializeHandlers: {
            priority: number;
            handler: PropertyHandler<SerializeHandlerParam>;
        }[];
        /**
         * 反序列化函数列表
         */
        deserializeHandlers: {
            priority: number;
            handler: PropertyHandler<DeserializeHandlerParam>;
        }[];
        /**
         * 比较差异函数列表
         */
        differentHandlers: {
            priority: number;
            handler: PropertyHandler<DifferentHandlerParam>;
        }[];
        /**
         * 设置函数列表
         */
        setValueHandlers: {
            priority: number;
            handler: PropertyHandler<HandlerParam>;
        }[];
        /**
         * 序列化对象
         *
         * 过程中使用 different与默认值作比较减少结果中的数据。
         *
         * @param target 被序列化的对象
         *
         * @returns 序列化后简单数据对象（由Object与Array组合可 JSON.stringify 的简单结构）
         */
        serialize<T>(target: T): gPartial<T>;
        /**
         * 删除 Json 对象中 CLASS_KEY 属性，防止被反序列化。
         *
         * @param obj
         */
        deleteCLASS_KEY(obj: Object): void;
        /**
         * 反序列化对象为基础对象数据（由Object与Array组合）
         *
         * @param object 换为Json的对象
         * @returns 反序列化后的数据
         */
        deserialize<T>(object: gPartial<T>): T;
        /**
         * 比较两个对象的不同，提取出不同的数据(可能会经过反序列化处理)
         *
         * @param target 用于检测不同的数据
         * @param source   模板（默认）数据
         * @param different 比较得出的不同（简单结构）数据
         *
         * @returns 比较得出的不同数据（由Object与Array组合可 JSON.stringify 的简单结构）
         */
        different<T>(target: T, source: T): gPartial<T>;
        /**
         * 从数据对象中提取数据给目标对象赋值（可能会经过序列化处理）
         *
         * @param target 目标对象
         * @param source 数据对象 可由Object与Array以及自定义类型组合
         */
        setValue<T>(target: T, source: gPartial<T>): T;
        /**
         * 克隆
         * @param target 被克隆对象
         */
        clone<T>(target: T): T;
    }
    export interface SerializationTempInfo {
        loadingNum?: number;
        onLoaded?: () => void;
    }
    export {};
}
//# sourceMappingURL=serialization.d.ts.map