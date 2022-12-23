import { EventEmitter } from './EventEmitter';

declare global
{
    /**
     * 事件列表
     */
    export interface MixinsGlobalEvents
    {
    }
}

/**
 * 全局事件发射器。
 */
export const globalEmitter = new EventEmitter<MixinsGlobalEvents>();
