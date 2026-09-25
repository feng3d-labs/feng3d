import { CanvasContext } from './CanvasContext';

/**
 * 画布纹理
 *
 * 包含画布上下文信息的纹理类型
 */
export interface CanvasTexture
{
    /**
     * 数据类型
     */
    readonly __type__?: 'CanvasTexture';

    /**
     * 画布上下文
     */
    readonly context: CanvasContext;
}
