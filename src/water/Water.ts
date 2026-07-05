import { decoratorRegisterClass } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
;
import { Object3D } from '../core/Object3D';
import { createPrimitive, registerPrimitive } from '../core/object3DLogic';
import { Renderable } from '../core/Renderable';
import { Geometry } from '../geometry/Geometry';
import { Material } from '../materials/Material';
import { AddComponentMenu } from '../Menu';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { FrameBufferObject } from '../render/FrameBufferObject';

// 触发 waterLogic 注册到 componentLogic 分发表
import './waterLogic';

declare global
{
    export interface MixinsPrimitiveObject3D
    {
        Water: Object3D;
    }
}

/**
 * 水面组件（纯数据）。
 *
 * 渲染逻辑由 {@link waterLogic} 提供。
 */
@AddComponentMenu('Graphics/Water')
@decoratorRegisterClass()
export class Water extends Renderable
{
    readonly __type__: string = 'Water';

    __class__: 'Water';

    geometry = Geometry.getDefault('Plane');

    material = Material.getDefault('Water-Material');

    /**
     * 帧缓冲对象，用于处理水面反射
     */
    frameBufferObject = new FrameBufferObject();
}

registerPrimitive('Water', (g) =>
{
    const c = new Water();
    reactive(g).components.push(c);
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Water',
        priority: -20000,
        click: () =>
            createPrimitive('Water')
    }
);
