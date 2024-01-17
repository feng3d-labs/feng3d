import { Texture } from '@feng3d/renderer';
import { SerializeProperty } from '@feng3d/serialization';
import { HideFlags } from '../core/HideFlags';

declare module '@feng3d/renderer'
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
