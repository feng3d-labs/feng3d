import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { Behaviour } from '../component/Behaviour';
;
import { AddComponentMenu } from '../Menu';
import { audioCtx, globalGain } from './AudioListener';

// 触发 audioSourceLogic 注册到 componentLogic 分发表
import './audioSourceLogic';

/**
 * 音量与距离算法
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PannerNode/distanceModel
 */
export enum DistanceModelType
{
    linear = 'linear',
    inverse = 'inverse',
    exponential = 'exponential',
}

/**
 * 声源（纯数据）。
 *
 * 音频逻辑（panner/gain/source 节点管理、play/stop、参数同步、位置同步）
 * 由 {@link audioSourceLogic} 提供。
 */
@AddComponentMenu('Audio/AudioSource')
@decoratorRegisterClass()
export class AudioSource extends Behaviour
{
    readonly __type__: string = 'AudioSource';

    /**
     * 声音文件路径
     */
    @serialize
    @oav({ component: 'OAVPick', tooltip: '声音文件路径', componentParam: { accepttype: 'audio' } })
    url = '';

    /**
     * 是否循环播放
     */
    @serialize
    @oav({ tooltip: '是否循环播放' })
    loop = true;

    /**
     * 音量
     */
    @serialize
    @oav({ tooltip: '音量' })
    volume = 1;

    /**
     * 是否启用位置影响声音
     */
    @serialize
    @oav({ tooltip: '是否启用位置影响声音' })
    enablePosition = true;

    coneInnerAngle = 360;
    coneOuterAngle = 0;
    coneOuterGain = 0;

    /**
     * 距离模式
     */
    @serialize
    @oav({ component: 'OAVEnum', tooltip: '距离模式，距离影响声音的方式', componentParam: { enumClass: DistanceModelType } })
    distanceModel = DistanceModelType.inverse;

    /**
     * 最大距离
     */
    @serialize
    @oav({ tooltip: '最大距离' })
    maxDistance = 10000;

    panningModel: PanningModelType = 'HRTF';

    /**
     * 参考距离
     */
    @serialize
    @oav({ tooltip: '参考距离' })
    refDistance = 1;

    /**
     * 滚降因子
     */
    @serialize
    @oav({ tooltip: '滚降因子' })
    rolloffFactor = 1;
}

/**
 * 创建 panner 节点
 */
export function createPanner(): PannerNode
{
    const panner = audioCtx.createPanner();

    if (panner.orientationX)
    {
        panner.orientationX.value = 1;
        panner.orientationY.value = 0;
        panner.orientationZ.value = 0;
    }
    else
    {
        panner.setOrientation(1, 0, 0);
    }

    return panner;
}

export { globalGain };
