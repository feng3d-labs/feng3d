import { Vector3 } from '@feng3d/math';
import type { Component } from '../component/Component';

import './transformLayoutLogic';

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
    position: Vector3;
    size: Vector3;
    leftTop: Vector3;
    rightBottom: Vector3;
    anchorMin: Vector3;
    anchorMax: Vector3;
    pivot: Vector3;
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
