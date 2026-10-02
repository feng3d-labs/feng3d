import { EventEmitter } from '@feng3d/event';
import type { RectangleLike } from '@feng3d/math';

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
     *
     * 参数放宽为 `RectangleLike`（issue #134 阶段 C-a：`Rectangle` 由 class 变为纯数据接口）
     * ——参数本来就没有被使用，放宽后普通 `{ x, y, width, height }` 也能传。
     */
    draw(_viewRect: RectangleLike)
    {
        return null;
    }
}

export const mouseRenderer = new MouseRenderer();
