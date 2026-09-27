/**
 * 动画片段的**数据形态**：`AnimationClip` 是 class（继承 EventEmitter），
 * 但纯数据范式里存进 JSON 的是结构相同的字面量，类型上用这个接口表达，
 * 两者互相兼容（class 实例满足接口，字面量也满足）。
 */
export interface AnimationClipData
{
    readonly assetType: AssetType.anim;
    readonly name: string;
    readonly length: number;
    readonly loop: boolean;
    readonly propertyClips: PropertyClip[];
}
import { EventEmitter } from '@feng3d/event';
import { AssetType } from '../assets/AssetType';
import { PropertyClip } from './PropertyClip';

export class AnimationClip extends EventEmitter
{
    readonly assetType = AssetType.anim;

    /**
     * 名称
     */
    name: string;

    /**
     * 动画时长，单位ms
     */
    length: number;

    loop = true;

    propertyClips: PropertyClip[];
}
