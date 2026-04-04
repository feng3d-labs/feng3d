import { Texture } from '../../renderer/data/Texture';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { HideFlags } from '../core/HideFlags';

declare module '../../../renderer/data/Texture'
{
    interface Texture
    {
        /**
         * 隐藏标记，用于控制是否在层级界面、检查器显示，是否保存
         */
        hideFlags: HideFlags;
    }
}

Texture.prototype.hideFlags = HideFlags.None;

SerializeProperty()(Texture.prototype, 'hideFlags');
