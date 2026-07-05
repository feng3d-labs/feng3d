import type { Component } from './Component';

import './graphicsLogic';

declare module './Component'
{
    export interface ComponentMap
    {
        Graphics: Graphics;
    }
}

/**
 * Graphics（纯数据接口）。
 */
export interface Graphics extends Component
{
    readonly __type__: 'Graphics';
}

/**
 * 创建 Graphics 实例。
 */
export function createGraphics(): Graphics
{
    return {
        __type__: 'Graphics'
    };
}
