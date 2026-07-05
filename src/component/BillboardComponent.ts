import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { Camera } from '../cameras/Camera';
import { AddComponentMenu } from '../Menu';
import { Component, } from './Component';

/**
 * 公告板组件（纯数据）。
 *
 * 当前 billboard 朝向逻辑为占位（TODO），默认 componentLogic（空 init/beforeRender/dispose）即可。
 */
@AddComponentMenu('Layout/BillboardComponent')
@decoratorRegisterClass()
export class BillboardComponent implements Component
{
    readonly __type__: string = 'BillboardComponent';

    __class__: 'BillboardComponent';

    /**
     * 相机
     */
    @oav()
    camera: Camera;
}
