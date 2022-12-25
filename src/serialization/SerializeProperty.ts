import { _serialize__ } from "./SerializationConst";

/**
 * 序列化装饰器
 *
 * 在属性定义前使用 @SerializeProperty() 进行标记需要序列化
 *
 * @see https://docs.unity3d.com/cn/current/ScriptReference/SerializeField.html
 */
export function SerializeProperty()
{
    /**
     * @param target 序列化原型
     * @param propertyKey 序列化属性
     */
    return (target: any, propertyKey: string) =>
    {
        if (!Object.getOwnPropertyDescriptor(target, _serialize__))
        {
            Object.defineProperty(target, _serialize__, { value: [] });
        }
        const serializePropertys: string[] = target[_serialize__];

        serializePropertys.push(propertyKey);
    }
}