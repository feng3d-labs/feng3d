import { _serialize__ } from "./Serialization";

/**
 * 序列化装饰器
 *
 * 在属性定义前使用 @serialize 进行标记需要序列化
 *
 * @param target 序列化原型
 * @param propertyKey 序列化属性
 */
export function serialize(target: any, propertyKey: string)
{
    if (!Object.getOwnPropertyDescriptor(target, _serialize__))
    {
        Object.defineProperty(target, _serialize__, { value: [] });
    }
    const serializePropertys: string[] = target[_serialize__];

    serializePropertys.push(propertyKey);
}