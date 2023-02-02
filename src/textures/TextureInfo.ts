import { HideFlags } from '../core/HideFlags';
import { Texture } from '../renderer/data/Texture';
import { SerializeProperty } from '../serialization/SerializeProperty';

/**
 * 纹理信息
 */
export abstract class TextureInfo extends Texture
{
    name: string;

    /**
     * 隐藏标记，用于控制是否在层级界面、检查器显示，是否保存
     */
    @SerializeProperty()
    hideFlags = HideFlags.None;
}
