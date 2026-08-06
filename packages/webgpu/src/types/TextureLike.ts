import { CanvasTexture } from '../data/CanvasTexture';
import { Texture } from '../data/Texture';

/**
 * 纹理类型（可以是 Texture 或 CanvasTexture）
 */
export type TextureLike = Texture | CanvasTexture;
