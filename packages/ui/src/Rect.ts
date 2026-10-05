import { AddComponentMenu, Camera, Component, createNodeMenu, createPrimitive, Object3D, RegisterComponent, registerPrimitive, Scene } from 'feng3d';
import { reactive } from '@feng3d/reactivity';
import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { RenderObject } from '@feng3d/webgpu';
import { CanvasRenderer } from './core/CanvasRenderer';
import { Transform2D } from './core/Transform2D';

/**
 * 承载 UI uniform 的渲染对象。
 *
 * RenderObject 本身未声明 uniforms 字段；UI 组件在 WebGPU 迁移过渡期仍按 uniforms 写入，
 * 这里通过扩展类型安全地访问该字段。
 */
type UIRenderObject = RenderObject & { uniforms: Record<string, unknown> };

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
@decoratorRegisterClass()
export class Rect extends Component
{
    /**
     * 填充颜色。
     */
    @oav()
    @serialize
    color = new Color4();

    beforeRender(renderObject: UIRenderObject, scene: Scene, camera: Camera)
    {
        super.beforeRender(renderObject, scene, camera);

        renderObject.uniforms.u_color = this.color;
    }
}

registerPrimitive('Rect', (g) =>
{
    const transform2D = new Transform2D(); reactive(g).components.push(transform2D); transform2D.setObject3D(g); transform2D.init();
    const cr = new CanvasRenderer(); reactive(g).components.push(cr); cr.setObject3D(g); cr.init();

    transform2D.size.x = 100;
    transform2D.size.y = 100;
    const rect = new Rect(); reactive(g).components.push(rect); rect.setObject3D(g); rect.init();
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: 'UI/Rect',
        priority: -2,
        click: () =>
            createPrimitive('Rect')
    }
);
