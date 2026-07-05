import { logic } from '../core/logic';
import { effect, reactive } from '@feng3d/reactivity';
import { BehaviourLogic, behaviourLogic } from '../component/behaviourLogic';
import { registerComponentLogic } from '../component/componentLogic';
import { transformLogic } from '../core/transformLogic';
import { AudioListener, audioCtx, globalGain } from './AudioListener';

/**
 * AudioListener 逻辑处理输出。
 *
 * 组合 behaviourLogic，额外：
 * - volume getter/setter（带 gain 节点副作用）
 * - effect 监听 enabled 变化时连接/断开 gain
 * - effect 监听 local2world 变化时更新 listener 位置/朝向
 */
export interface AudioListenerLogic extends BehaviourLogic
{
    volume: number;
}


/**
 * 获取 AudioListener 的 logic。
 */
export function audioListenerLogic(audioListener: AudioListener): AudioListenerLogic

{
    return logic<AudioListenerLogic>(audioListener);
}

function createAudioListenerLogic(audioListener: AudioListener): AudioListenerLogic
{
    const base = behaviourLogic(audioListener);
    let _gain: GainNode | null = null;
    let _volume = 1;
    let _inited = false;

    function _enabledChanged(): void
    {
        if (!_gain) return;
        if (audioListener.enabled)
        {
            globalGain.connect(_gain);
        }
        else
        {
            globalGain.disconnect(_gain);
        }
    }

    function _onScenetransformChanged(): void
    {
        const local2world = transformLogic(logic.object3D).local2world.value;
        const position = local2world.getPosition();
        const forward = local2world.getAxisZ();
        const up = local2world.getAxisY();
        //
        const listener = audioCtx.listener;
        // feng3d中为左手坐标系，listener中使用的为右手坐标系
        if (listener.forwardX)
        {
            listener.positionX.setValueAtTime(position.x, audioCtx.currentTime);
            listener.positionY.setValueAtTime(position.y, audioCtx.currentTime);
            listener.positionZ.setValueAtTime(-position.z, audioCtx.currentTime);
            listener.forwardX.setValueAtTime(forward.x, audioCtx.currentTime);
            listener.forwardY.setValueAtTime(forward.y, audioCtx.currentTime);
            listener.forwardZ.setValueAtTime(-forward.z, audioCtx.currentTime);
            listener.upX.setValueAtTime(up.x, audioCtx.currentTime);
            listener.upY.setValueAtTime(up.y, audioCtx.currentTime);
            listener.upZ.setValueAtTime(-up.z, audioCtx.currentTime);
        }
        else
        {
            listener.setOrientation(forward.x, forward.y, -forward.z, up.x, up.y, -up.z);
            listener.setPosition(position.x, position.y, -position.z);
        }
    }

    const logic: AudioListenerLogic = {
        object3D: null as any,
        get isVisibleAndEnabled() { return base.isVisibleAndEnabled; },
        get volume() { return _volume; },
        set volume(v)
        {
            _volume = v;
            if (_gain)
            {
                _gain.gain.setTargetAtTime(v, audioCtx.currentTime, 0.01);
            }
        },
        init()
        {
            if (_inited) return;
            _inited = true;
            base.init();

            _gain = audioCtx.createGain();
            _gain.connect(audioCtx.destination);
            reactive(audioListener).gain = _gain;
            reactive(audioListener).enabled = true;

            // effect 监听 enabled 变化时连接/断开 gain
            effect(() =>
            {
                reactive(audioListener).enabled;
                _enabledChanged();
            });

            // effect 监听 local2world 变化时更新 listener
            effect(() =>
            {
                transformLogic(logic.object3D).local2world.value;
                _onScenetransformChanged();
            });
        },
        beforeRender(ro, scene, camera) { base.beforeRender(ro, scene, camera); },
        update(interval: number) { base.update(interval); },
        dispose()
        {
            base.dispose();
            _gain = null;
                    },
    };

    return logic;
}

// 注册到 componentLogic 分发表
registerComponentLogic('AudioListener', (component) =>
{
    return createAudioListenerLogic(component as AudioListener);
});
