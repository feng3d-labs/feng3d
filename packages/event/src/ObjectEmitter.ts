import { AnyEmitter, anyEmitter } from './AnyEmitter';
import { IEventTarget } from './IEventTarget';

/**
 * 只针对Object的事件
 *
 * `objectEmitter` 与 `anyEmitter` 引用同一个单例实例，此处以 `ObjectEventType` 事件映射重新标注类型，
 * 使使用方获得属性值变化事件的精确数据类型。
 */
export const objectEmitter: AnyEmitter<IEventTarget, ObjectEventType> = anyEmitter;

/**
 * Object 事件类型
 */
export interface ObjectEventType
{
    /**
     * 属性值变化
     */
    propertyValueChanged: { property: string, oldValue: unknown, newValue: unknown };
}
