import { IElement, ShaderValue } from './IElement';

/**
 * 变量宿主接口
 * 描述能够承载一个 ShaderValue 类型值（如 Uniform/Attribute/Varying）的对象。
 * 这些对象拥有自己的名称（用于声明），并将关联的类型实例保存到 `value` 字段。
 */
export interface VariableHost extends IElement
{
    /** 变量名称（用于声明与引用） */
    readonly name: string;
    /** 关联的类型值（由 vec2/vec3/float 等类型构造函数设置） */
    value?: ShaderValue;
}

/**
 * 判断一个对象是否为变量宿主（Uniform/Attribute/Varying 等）
 *
 * 通过结构特征（鸭子类型）判断，避免引入具体的类造成循环依赖：
 * 宿主对象拥有 string 类型的 `name` 属性，以及可写的 `value` 字段。
 *
 * @param obj 待判断的对象
 * @returns 如果是变量宿主返回 true
 */
export function isVariableHost(obj: unknown): obj is VariableHost
{
    return typeof obj === 'object'
        && obj !== null
        && typeof (obj as Record<string, unknown>).name === 'string'
        && 'value' in obj;
}

/**
 * 将当前构造的类型实例关联到变量宿主（Uniform/Attribute/Varying）
 *
 * 行为：
 * 1. 将实例的 `toGLSL`/`toWGSL` 设置为返回宿主的名称
 * 2. 将实例的 `dependencies` 设置为 `[host]`
 * 3. 将宿主的 `value` 设置为当前实例（建立双向引用）
 *
 * @param instance 当前正在构造的类型实例（this）
 * @param host 变量宿主
 * @returns true 表示已处理（调用方应直接返回），false 表示未处理
 */
export function bindToVariableHost(instance: { toGLSL: () => string; toWGSL: () => string; dependencies: IElement[] }, host: VariableHost): boolean
{
    const name = host.name;
    instance.toGLSL = () => name;
    instance.toWGSL = () => name;
    instance.dependencies = [host];
    host.value = instance as unknown as ShaderValue;

    return true;
}
