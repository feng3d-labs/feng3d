import { Vector3 } from '@feng3d/math';
import type { Component } from '../component/Component';

import './transformLayoutLogic';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        TransformLayout: TransformLayout;
    }
}

declare global
{
    export interface MixinsObject3DEventMap
    {
        sizeChanged: TransformLayout;
        pivotChanged: TransformLayout;
    }
}

/**
 * TransformLayout（纯数据接口）。
 */
export interface TransformLayout extends Component
{
    readonly __type__: 'TransformLayout';
    readonly position: Vector3;
    readonly size: Vector3;
    readonly leftTop: Vector3;
    readonly rightBottom: Vector3;
    readonly anchorMin: Vector3;
    readonly anchorMax: Vector3;
    readonly pivot: Vector3;
}

/**
 * 创建 TransformLayout 实例。
 */
export function createTransformLayout(): TransformLayout
{
    return {
        __type__: 'TransformLayout',
        position: new Vector3(),
        size: new Vector3(1, 1, 1),
        leftTop: new Vector3(0, 0, 0),
        rightBottom: new Vector3(0, 0, 0),
        anchorMin: new Vector3(0.5, 0.5, 0.5),
        anchorMax: new Vector3(0.5, 0.5, 0.5),
        pivot: new Vector3(0.5, 0.5, 0.5),
    };
}
