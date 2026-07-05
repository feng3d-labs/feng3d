import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { Component } from './Component';

/**
 * 线框组件，将会对拥有该组件的对象绘制线框
 */
@decoratorRegisterClass()
export class WireframeComponent implements Component
{
    readonly __type__: string = 'WireframeComponent';

    __class__: 'WireframeComponent';

    @oav()
    color = new Color4(125 / 255, 176 / 255, 250 / 255);
}
