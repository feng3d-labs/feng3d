import { EventEmitter } from './EventEmitter';

/**
 * 全局事件列表
 */
export interface GlobalEvents
{
}

/**
 * 全局事件发射器。
 */
export const globalEmitter = new EventEmitter<GlobalEvents>();
