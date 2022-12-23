import { Camera } from '../core/cameras/Camera';
import { RegisterComponent, Component } from '../core/component/Component';
import { Object3D } from '../core/core/Object3D';
import { AddComponentMenu } from '../core/Menu';
import { createNodeMenu } from '../core/menu/CreateNodeMenu';
import { Scene } from '../core/scene/Scene';
import { Color4 } from '../math/Color4';
import { oav } from '../objectview/ObjectView';
import { RenderAtomic } from '../renderer/data/RenderAtomic';
import { Serializable } from '../serialization/Serializable';
import { serialize } from '../serialization/serialize';
import { CanvasRenderer } from './core/CanvasRenderer';
import { Transform2D } from './core/Transform2D';

declare global
{
    export interface MixinsComponentMap
    {
        Rect: Rect;
    }

    export interface MixinsPrimitiveObject3D
    {
        Rect: Object3D;
    }
}

/**
 * 矩形纯色组件
 *
 * 用于填充UI中背景等颜色。
 */
@AddComponentMenu('UI/Rect')
@RegisterComponent()
@Serializable()
export class Rect extends Component
{
    /**
     * 填充颜色。
     */
    @oav()
    @serialize
    color = new Color4();

    beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
    {
        super.beforeRender(renderAtomic, scene, camera);

        renderAtomic.uniforms.u_color = this.color;
    }
}

Object3D.registerPrimitive('Rect', (g) =>
{
    const transform2D = g.addComponent(Transform2D);
    g.addComponent(CanvasRenderer);

    transform2D.size.x = 100;
    transform2D.size.y = 100;
    g.addComponent(Rect);
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'UI/Rect',
        priority: -2,
        click: () =>
            Object3D.createPrimitive('Rect')
    }
);
