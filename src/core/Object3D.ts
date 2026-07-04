import { decoratorRegisterClass } from '@feng3d/polyfill';
import { AssetType } from '../assets/AssetType';
import type { Component } from '../component/Component';
import type { Geometry } from '../geometry/Geometry';
import { Container } from './Container';
import { entityLogic } from './entityLogic';
import type { Feng3dObjectEventMap } from './Feng3dObject';
import { Scene } from '../scene/Scene';

declare global
{
    interface MixinsObject3DEventMap { }
    interface MixinsPrimitiveObject3D { }
    interface MixinsObject3D { }
}

export interface Object3DEventMap extends MixinsObject3DEventMap, Feng3dObjectEventMap
{
    /**
     * 添加子组件事件
     */
    addComponent: { object3D: Object3D, component: Component };

    /**
     * 移除子组件事件
     */
    removeComponent: { object3D: Object3D, component: Component };

    /**
     * 添加了子对象，当child被添加到parent中时派发冒泡事件
     */
    addChild: { parent: Object3D, child: Object3D }
    /**
     * 删除了子对象，当child被parent移除时派发冒泡事件
     */
    removeChild: { parent: Object3D, child: Object3D };

    /**
     * 自身被添加到父对象中事件
     */
    added: { parent: Object3D };

    /**
     * 自身从父对象中移除事件
     */
    removed: { parent: Object3D };

    /**
     * 当Object3D的scene属性被设置是由Scene派发
     */
    addedToScene: Object3D;

    /**
     * 当Object3D的scene属性被清空时由Scene派发
     */
    removedFromScene: Object3D;

    /**
     * 包围盒失效
     */
    boundsInvalid: Geometry;

    /**
     * 刷新界面
     */
    refreshView: any;

    /**
     * 场景变换改变事件
     */
    scenetransformChanged: void;

    /**
     * 本地转世界矩阵更新事件
     */
    updateLocalToWorldMatrix: void;
}

export interface Object3D extends MixinsObject3D { }

/**
 * 游戏对象，场景唯一存在的对象类型
 *
 * 纯数据结构体：仅包含 readonly 基础属性，可 JSON 序列化。
 * 所有行为逻辑（组件管理、层级管理、激活状态、包围盒等）由 {@link object3DLogic} 提供。
 *
 * 原始游戏对象创建等工厂方法以独立函数形式提供：
 * {@link createPrimitive}、{@link registerPrimitive}、{@link findObject3D}。
 */
@decoratorRegisterClass()
export class Object3D extends Container
{
    __class__ = 'Object3D';

    constructor()
    {
        super();
        // 触发 entityLogic，注册 components.push 拦截器（自动 setObject3D + init）
        entityLogic(this);
    }

    /**
     * 名称
     */
    readonly name: string = 'Object3D';

    /**
     * The tag of this game object.
     */
    readonly tag: string = '';

    /**
     * 自身以及子对象是否支持鼠标拾取
     */
    readonly mouseEnabled: boolean = true;

    /**
     * The local active state of this Object3D.
     *
     * 通过 object3DLogic(object3D).setActive(value) 修改。
     */
    readonly activeSelf: boolean = true;

    /**
     * 资源类型
     */
    readonly assetType: string = AssetType.object3D;

    /**
     * 资源编号
     */
    readonly assetId: string = '';

    /**
     * 预设资源编号
     */
    readonly prefabId: string = '';

    /**
     * 本地位移
     */
    readonly position: { readonly x: number; readonly y: number; readonly z: number } = { x: 0, y: 0, z: 0 };

    /**
     * 本地旋转
     */
    readonly rotation: { readonly x: number; readonly y: number; readonly z: number } = { x: 0, y: 0, z: 0 };

    /**
     * 本地缩放
     */
    readonly scale: { readonly x: number; readonly y: number; readonly z: number } = { x: 1, y: 1, z: 1 };

    /**
     * 所在场景（只读，响应式）。
     *
     * 由层级关系自动维护，无需手动设置。
     */
    readonly scene: Scene | null = null;
}
