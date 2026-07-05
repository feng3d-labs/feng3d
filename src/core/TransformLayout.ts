import { Vector3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { Component, } from '../component/Component';
import { AddComponentMenu } from '../Menu';

// 触发 transformLayoutLogic 注册到 componentLogic 分发表
import './transformLayoutLogic';

declare global
{
    export interface MixinsObject3DEventMap
    {
        /**
         * 尺寸变化事件
         */
        sizeChanged: TransformLayout;

        /**
         * 中心点变化事件
         */
        pivotChanged: TransformLayout;
    }
}

/**
 * 变换布局（纯数据）。
 *
 * 提供比 Transform 更适用于 2D 元素的布局 API。
 *
 * 布局计算（根据 anchor/pivot/size 推导 position）由 {@link transformLayoutLogic} 提供。
 */
@AddComponentMenu('Layout/TransformLayout')
@decoratorRegisterClass()
export class TransformLayout implements Component
{
    readonly __type__: string = 'TransformLayout';

    /**
     * 位移
     */
    @oav({ tooltip: '位移', componentParam: { step: 1, stepScale: 1, stepDownup: 1 } })
    @serialize
    position = new Vector3();

    /**
     * 尺寸，宽高。
     */
    @oav({ tooltip: '宽度，不会影响到缩放值。', componentParam: { step: 1, stepScale: 1, stepDownup: 1 } })
    @serialize
    size = new Vector3(1, 1, 1);

    /**
     * 与最小最大锚点形成的边框的 left/top 距离。
     */
    @oav({ tooltip: 'leftTop', componentParam: { step: 1, stepScale: 1, stepDownup: 1 } })
    @serialize
    leftTop = new Vector3(0, 0, 0);

    /**
     * 与最小最大锚点形成的边框的 right/bottom 距离。
     */
    @oav({ tooltip: 'rightBottom', componentParam: { step: 1, stepScale: 1, stepDownup: 1 } })
    @serialize
    rightBottom = new Vector3(0, 0, 0);

    /**
     * 最小锚点，父 Transform2D 中左上角锚定的规范化位置。
     */
    @oav({ tooltip: '最小锚点', componentParam: { step: 0.01, stepScale: 0.01, stepDownup: 0.01 } })
    @serialize
    anchorMin = new Vector3(0.5, 0.5, 0.5);

    /**
     * 最大锚点，父 Transform2D 中左上角锚定的规范化位置。
     */
    @oav({ tooltip: '最大锚点', componentParam: { step: 0.01, stepScale: 0.01, stepDownup: 0.01 } })
    @serialize
    anchorMax = new Vector3(0.5, 0.5, 0.5);

    /**
     * The normalized position in this RectTransform that it rotates around.
     */
    @oav({ tooltip: '中心点' })
    @serialize
    pivot = new Vector3(0.5, 0.5, 0.5);
}
