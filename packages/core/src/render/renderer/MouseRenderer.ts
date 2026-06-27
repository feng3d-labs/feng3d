import { EventEmitter } from '@feng3d/event';
import { Rectangle } from '@feng3d/math';

/**
 * 鼠标拾取渲染器。
 *
 * 原 WebGL 实现通过 GL readPixels 读取 objectID 进行 GPU 拾取。
 * 已重写为空实现：鼠标拾取现由 Mouse3DManager 配合 Raycaster（CPU 射线拾取）完成，
 * 不再依赖 GPU 读回。保留类与单例以兼容历史引用。
 */
export class MouseRenderer extends EventEmitter
{
    /**
     * 渲染（已废弃，拾取由 CPU 射线完成）。
     */
    draw(_viewRect: Rectangle)
    {
        return null;
    }
}

export const mouseRenderer = new MouseRenderer();
