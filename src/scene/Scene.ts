import { Color4, Ray3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { Camera } from '../cameras/Camera';
import { Component, RegisterComponent } from '../component/Component';
import { RunEnvironment } from '../core/RunEnvironment';

// 触发 sceneLogic 注册到 componentLogic 分发表
import './sceneLogic';
export { sceneLogic } from './sceneLogic';
export type { SceneLogic } from './sceneLogic';

declare global
{
    /**
     * 组件事件
     */
    export interface MixinsObject3DEventMap
    {
        addToScene: any;
        removeFromScene: any;
        addComponentToScene: any;
    }

    export interface MixinsComponentMap { Scene: Scene; }
}

/**
 * 3D场景（纯数据）。
 *
 * 场景逻辑（update、组件集合查询、拾取缓存、视锥剔除）由 {@link sceneLogic} 提供。
 */
@RegisterComponent()
@decoratorRegisterClass()
export class Scene extends Component
{
    __class__: 'Scene';

    /**
     * 背景颜色
     */
    @serialize
    @oav()
    background = new Color4(0, 0, 0, 1);

    /**
     * 环境光强度
     */
    @serialize
    @oav()
    ambientColor = new Color4();

    /**
     * 指定所运行环境
     *
     * 控制运行符合指定环境场景中所有 Behaviour.update 方法
     */
    runEnvironment = RunEnvironment.feng3d;

    /**
     * 鼠标射线，在渲染时被设置
     */
    mouseRay3D: Ray3;

    /**
     * 上次渲染时用的摄像机
     */
    camera: Camera;
}
