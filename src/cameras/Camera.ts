import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import { serialize } from '@feng3d/serialization';
import { Component } from '../component/Component';
import { Object3D } from '../core/Object3D';
import { createPrimitive, registerPrimitive } from '../core/object3DLogic';
import { AddComponentMenu } from '../Menu';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { BufferBinding } from '@feng3d/webgpu';
import { LensBase } from './lenses/LensBase';

// 触发 cameraLogic 注册到 componentLogic 分发表
import './cameraLogic';
export { cameraLogic } from './cameraLogic';
export type { CameraLogic } from './cameraLogic';

declare global
{
    export interface MixinsObject3DEventMap
    {
        lensChanged;
    }
    export interface MixinsPrimitiveObject3D
    {
        Camera: Object3D;
    }
}

declare module '@feng3d/webgpu'
{
    export interface BindingResources
    {
        cameraUniforms: BufferBinding<TransformUniforms>;
    }
}

/**
 * 摄像机（纯数据）。
 *
 * lens/projection 作为数据字段保留（供序列化/编辑器使用）。
 * 相机逻辑（viewProjection/frustum、坐标变换、getUniforms、effect 监听 transform 与 lens 变化）
 * 由 {@link cameraLogic} 提供。
 */
@AddComponentMenu('Rendering/Camera')
@decoratorRegisterClass()
export class Camera implements Component
{
    readonly __type__: string = 'Camera';

    __class__: 'Camera';

    /**
     * 镜头（数据字段，供序列化/编辑器使用；lens 变化的副作用由 cameraLogic 处理）
     */
    @serialize
    @oav({ component: 'OAVObjectView' })
    lens: LensBase;
}

registerPrimitive('Camera', (g) =>
{
    const c = new Camera();
    reactive(g).components.push(c);
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'Camera',
        priority: -2,
        click: () =>
            createPrimitive('Camera')
    }
);
