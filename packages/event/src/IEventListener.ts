import { IEvent } from './IEvent';

/**
 * 事件监听器。
 */
export interface IEventListener
{
    /**
     * 监听函数
     */
    listener: (event: IEvent) => void;

    /**
     * 监听函数作用域
     */
    thisObject: unknown;

    /**
     * 优先级
     */
    priority: number;

    /**
     * 是否只监听一次
     */
    once: boolean;
}
