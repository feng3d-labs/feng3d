import type { Component } from './Component';
import type { Camera } from '../cameras/Camera';
import { registerDefaults } from '@feng3d/reactivity';


declare module './Component'
{
    export interface ComponentMap
    {
        BillboardComponent: BillboardComponent;
    }
}

/**
 * BillboardComponent（纯数据接口）。
 */
export interface BillboardComponent extends Component
{
    readonly __type__: 'BillboardComponent';
    /** 注视的相机（缺失时由 registerDefaults 自动填充为 null，使用时另行赋值） */
    readonly camera?: Camera | null;
}

/**
 * BillboardComponent 默认值模板。
 */
const billboardComponentDefaults = {
    __type__: 'BillboardComponent' as const,
    camera: null as Camera | null,
};

registerDefaults('BillboardComponent', billboardComponentDefaults);

/**
 * 创建 BillboardComponent 实例。
 */
export function createBillboardComponent(): BillboardComponent
{
    return { ...billboardComponentDefaults };
}
