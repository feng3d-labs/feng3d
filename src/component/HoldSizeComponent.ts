import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { Camera } from '../cameras/Camera';
import { AddComponentMenu } from '../Menu';
import { Component, } from './Component';

/**
 * 保持缩放尺寸组件（纯数据）。
 *
 * 当前 holdSize 逻辑为占位（TODO），默认 componentLogic（空 init/beforeRender/dispose）即可。
 */
@AddComponentMenu('Layout/HoldSizeComponent')
@decoratorRegisterClass()
export class HoldSizeComponent implements Component
{
    readonly __type__: string = 'HoldSizeComponent';

    __class__: 'HoldSizeComponent';

    /**
     * 保持缩放尺寸
     */
    @oav()
    holdSize = 1;

    /**
     * 相机
     */
    @oav()
    camera: Camera;
}
