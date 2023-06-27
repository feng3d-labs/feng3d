import { NodeComponent } from '../core/NodeComponent';
import { RegisterComponent } from '../ecs/Component';
import { oav } from '@feng3d/objectview';
import { SerializeProperty } from '../serialization/SerializeProperty';
import { watcher } from '../watcher/watcher';
import { AnimationClip } from './AnimationClip';
import { PropertyClip, PropertyClipPathItemType } from './PropertyClip';

declare module '../ecs/Component'
{
    interface ComponentMap { Animation: Animation; }
}

@RegisterComponent({ name: 'Animation', menu: 'Animator/Animation' })
export class Animation extends NodeComponent
{
    @oav({ component: 'OAVDefault', componentParam: { dragparam: { accepttype: 'animationclip', datatype: 'animationclip' } } })
    @SerializeProperty()
    animation: AnimationClip;

    @oav({ component: 'OAVArray', componentParam: { dragparam: { accepttype: 'animationclip', datatype: 'animationclip' }, defaultItem: () => new AnimationClip() } })
    @SerializeProperty()
    animations: AnimationClip[] = [];

    /**
     * 动画事件，单位为ms
     */
    @oav()
    time = 0;

    @oav()
    @SerializeProperty()
    isplaying = false;

    /**
     * 播放速度
     */
    @oav()
    @SerializeProperty()
    playspeed = 1;

    /**
     * 动作名称
     */
    get clipName()
    {
        return this.animation ? this.animation.name : null;
    }

    constructor()
    {
        super();
        watcher.watch(this as Animation, 'animation', this._onAnimationChanged, this);
        watcher.watch(this as Animation, 'time', this._onTimeChanged, this);
    }

    update(interval: number)
    {
        if (this.isplaying) this.time += interval * this.playspeed;
    }

    destroy()
    {
        this.animation = null;
        this.animations = null;
        super.destroy();
    }

    private _updateAni()
    {
        if (!this.animation) return;

        const cycle = this.animation.length;
        const cliptime = (this.time % cycle + cycle) % cycle;

        const propertyClips = this.animation.propertyClips;

        for (let i = 0; i < propertyClips.length; i++)
        {
            const propertyClip = propertyClips[i];

            if (propertyClip.times.length === 0) continue;
            const propertyHost = this.getPropertyHost(propertyClip);
            if (!propertyHost) continue;
            propertyHost[propertyClip.propertyName] = propertyClip.getValue(cliptime);
        }
    }

    private getPropertyHost(propertyClip: PropertyClip)
    {
        let propertyHost = this.node;
        const path = propertyClip.path;

        for (let i = 0; i < path.length; i++)
        {
            const element = path[i];
            switch (element[0])
            {
                case PropertyClipPathItemType.Node3D:
                    propertyHost = propertyHost.find(element[1]);
                    break;
                case PropertyClipPathItemType.Component:
                    propertyHost = propertyHost.getComponent(element[1] as any);
                    break;
                default:
                    console.error(`无法获取 PropertyHost ${element}`);
            }
            if (!propertyHost)
            {
                return null;
            }
        }

        return propertyHost;
    }

    private _onAnimationChanged()
    {
        this.time = 0;
    }

    private _onTimeChanged()
    {
        this._updateAni();
    }
}
