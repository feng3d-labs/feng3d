import { AnyEmitter, anyEmitter } from './AnyEmitter';

/**
 * 只针对Object的事件
 */
export const objectEmitter: AnyEmitter<any, ObjectEventType> = anyEmitter;

/**
 * Object 事件类型
 */
export interface ObjectEventType
{
    /**
     * 属性值变化
     */
    propertyValueChanged: { property: string, oldValue: any, newValue: any };
}
