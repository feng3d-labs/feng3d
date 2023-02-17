import { Texture } from '../renderer/data/Texture';
import { UniformTypeMap } from '../renderer/data/Uniforms';
import { TextureTarget } from '../renderer/gl/WebGLEnums';

declare module '../renderer/data/Texture'
{
    interface TextureMap extends Texture2DMap { }
}

export interface Texture2DMap
{
    Texture2D: Texture2D;
}

export type Texture2DLike = Texture2DMap[keyof Texture2DMap];

declare module '../renderer/data/Uniforms'
{
    interface UniformTypeMap
    {
        texture2D: Texture2D;
        texture2DArray: Texture2D[];
    }
}

/**
 * 2D纹理
 */
export abstract class Texture2D extends Texture
{
    textureTarget: TextureTarget = 'TEXTURE_2D';

    constructor(param?: Partial<Texture2D>)
    {
        super();
        Object.assign(this, param);
    }

    /**
     * 默认贴图
     */
    static white: Texture2D;

    /**
     * 默认贴图
     */
    static default: Texture2D;

    /**
     * 默认法线贴图
     */
    static defaultNormal: Texture2D;

    /**
     * 默认粒子贴图
     */
    static defaultParticle: Texture2D;
}

