import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';
import { Behaviour } from '../component/Behaviour';
import { RegisterComponent } from '../component/Component';
import { AddComponentMenu } from '../Menu';
import { AnimationClip } from './AnimationClip';

// 触发 animationLogic 注册到 componentLogic 分发表
import './animationLogic';

declare global
{
    export interface MixinsComponentMap { Animation: Animation; }
}

/**
 * 动画组件（纯数据）。
 *
 * 动画逻辑（动画曲线应用、播放、time 累加）由 {@link animationLogic} 提供。
 */
@AddComponentMenu('Animator/Animation')
@RegisterComponent()
export class Animation extends Behaviour
{
    @oav({ component: 'OAVDefault', componentParam: { dragparam: { accepttype: 'animationclip', datatype: 'animationclip' } } })
    @serialize
    animation: AnimationClip;

    @oav({ component: 'OAVArray', componentParam: { dragparam: { accepttype: 'animationclip', datatype: 'animationclip' }, defaultItem: () => new AnimationClip() } })
    @serialize
    animations: AnimationClip[] = [];

    /**
     * 动画事件，单位为ms
     */
    @oav()
    time = 0;

    @oav()
    @serialize
    isplaying = false;

    /**
     * 播放速度
     */
    @oav()
    @serialize
    playspeed = 1;

    /**
     * 动作名称
     */
    get clipName()
    {
        return this.animation ? this.animation.name : null;
    }
}
