import { __class__ } from "./SerializationConst";

/**
 * 返回对象的类名。
 * @param instance 对象实例、原始类型（如number，Boolean等）对象
 * @returns 包含类名称的字符串。
 */
export function getClassName(instance: Object): string
{
    const prototype: Object = Object.getPrototypeOf(instance);
    if (prototype.hasOwnProperty(__class__))
    {
        return prototype[__class__];
    }

    console.warn(`名称为 ${prototype.constructor.name} 的 ${instance} 未注册，请使用 @Serializable 进行注册反序列化的类。`);

    return null;
}