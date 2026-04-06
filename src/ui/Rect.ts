import { AddComponentMenu, Camera, Component, createNodeMenu, GameObject, RegisterComponent, Scene } from '@feng3d/core';
import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { RenderAtomic } from '@feng3d/renderer';
import { serialize } from '@feng3d/serialization';
import { CanvasRenderer } from './core/CanvasRenderer';
import { Transform2D } from './core/Transform2D';

declare global
{
    export interface MixinsComponentMap
    {
        Rect: Rect;
    }

    export interface MixinsPrimitiveGameObject
    {
        Rect: GameObject;
    }
}

/**
 * 矩形纯色组件
 *
 * 用于填充UI中背景等颜色。
 */
@AddComponentMenu('UI/Rect')
@RegisterComponent()
@decoratorRegisterClass()
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

GameObject.registerPrimitive('Rect', (g) =>
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
            GameObject.createPrimitive('Rect')
    }
);
