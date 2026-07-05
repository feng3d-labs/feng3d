import type { Component } from './Component';

import './graphicsLogic';

/**
 * Graphics（纯数据接口）。
 */
export interface Graphics extends Component
{

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
