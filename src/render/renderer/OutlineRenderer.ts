import { logic } from '@feng3d/reactivity';
import { RenderPass, RenderPassObject, Submit } from '@feng3d/webgpu';
import { Camera } from '../../cameras/Camera';
import { CartoonComponent } from '../../component/CartoonComponent';
import { OutLineComponent } from '../../component/OutLineComponent';
import { getComponent } from '../../component/componentQuery';
import type { Renderable } from '../../core/Renderable';
import type { Scene } from '../../scene/Scene';

/**
 * 轮廓渲染器
 *
 * TODO: 待接入 WebGPU 渲染路径（原依赖已移除的 shader/next WebGL 兼容机制）。
 */
export class OutlineRenderer
{
    draw(_submit: Submit, scene: Scene, camera: Camera)
    {
        const unblenditems = logic(scene).getPickCache(camera).unblenditems;

        for (let i = 0; i < unblenditems.length; i++)
        {
            const renderable = unblenditems[i];
            const obj = logic(renderable).entity;
            if (getComponent(obj, 'OutLineComponent') || getComponent(obj, 'CartoonComponent'))
            {
                // TODO: 使用轮廓材质/着色器重新绘制
            }
        }
    }
}

/**
 * 轮廓渲染器
 */
export const outlineRenderer = new OutlineRenderer();
