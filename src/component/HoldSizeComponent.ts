import type { Component } from './Component';
import type { Camera } from '../cameras/Camera';
import { registerDefaults } from '@feng3d/reactivity';


declare module './Component'
{
    export interface ComponentMap
    {
        HoldSizeComponent: HoldSizeComponent;
    }
}

/**
 * HoldSizeComponent（纯数据接口）。
 */
export interface HoldSizeComponent extends Component
{
    readonly __type__: 'HoldSizeComponent';
    /** 保持的屏幕尺寸（缺失时由 registerDefaults 自动填充） */
    readonly holdSize?: number;
    /** 注视的相机（缺失时由 registerDefaults 自动填充为 null，使用时另行赋值） */
    readonly camera?: Camera | null;
}

/**
 * HoldSizeComponent 默认值模板。
 */
const holdSizeComponentDefaults = {
    __type__: 'HoldSizeComponent' as const,
    holdSize: 1,
    camera: null as Camera | null,
};

registerDefaults('HoldSizeComponent', holdSizeComponentDefaults);

/**
 * 创建 HoldSizeComponent 实例。
 */
export function createHoldSizeComponent(): HoldSizeComponent
{
    return { ...holdSizeComponentDefaults };
}
