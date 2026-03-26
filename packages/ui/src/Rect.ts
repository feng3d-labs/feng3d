import { Camera3D, Scene3D, createNodeMenu } from '@feng3d/core';
import { Component, RegisterComponent } from '@feng3d/ecs';
import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { RenderAtomic } from '@feng3d/renderer';
import { SerializeProperty } from '@feng3d/serialization';
import { Node2D } from './core/Node2D';

declare module '@feng3d/ecs' { interface ComponentMap { Rect: Rect; } }

declare module './core/Node2D' { interface PrimitiveNode2D { Rect: Node2D; } }

/**
 * 矩形纯色组件
 *
 * 用于填充UI中背景等颜色。
 */
@RegisterComponent({ name: 'Rect', menu: 'UI/Rect' })
export class Rect extends Component
{
    /**
     * 填充颜色。
     */
    @oav()
    @SerializeProperty()
    color = new Color4();

    beforeRender(renderAtomic: RenderAtomic, scene: Scene3D, camera: Camera3D)
    {
        super.beforeRender(renderAtomic, scene, camera);

        renderAtomic.uniforms.u_color = this.color;
    }
}

Node2D.registerPrimitive('Rect', (g) =>
{
    g.addComponent('CanvasRenderer');

    g.size.x = 100;
    g.size.y = 100;
    g.addComponent('Rect');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'UI/Rect',
        priority: -2,
        click: () =>
            Node2D.createPrimitive('Rect')
    }
);
