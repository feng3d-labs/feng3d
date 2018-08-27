namespace feng3d
{

    export interface ComponentMap { Animation: Animation; }

    export class Animation extends Behaviour
    {
        @oav({ component: "OAVDefault", componentParam: { dragparam: { accepttype: "animationclip", datatype: "animationclip" } } })
        @serialize
        @watch("onAnimationChanged")
        animation: AnimationClip

        @oav({ component: "OAVArray", componentParam: { dragparam: { accepttype: "animationclip", datatype: "animationclip" }, defaultItem: () => new AnimationClip() } })
        @serialize
        animations: AnimationClip[] = [];

        /**
         * 动画事件，单位为ms
         */
        @oav()
        @watch("onTimeChanged")
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

        public update(interval: number)
        {
            if (this.isplaying)
                this.time += interval * this.playspeed;
        }

        private num = 0;
        private updateAni()
        {
            if (!this.animation)
                return;
            if ((this.num++) % 2 != 0)
                return;

            var cycle = this.animation.length;
            var cliptime = (this.time % (cycle) + cycle) % cycle;

            var propertyClips = this.animation.propertyClips;

            for (var i = 0; i < propertyClips.length; i++)
            {
                var propertyClip = propertyClips[i];

                var propertyValues = propertyClip.propertyValues;
                if (propertyValues.length == 0)
                    continue;
                var propertyHost = this.getPropertyHost(propertyClip);
                if (!propertyHost)
                    continue;
                var propertyValue = propertyClip.getValue(cliptime);
                propertyHost[propertyClip.propertyName] = propertyValue;
            }
        }

        private _objectCache = new Map();

        private getPropertyHost(propertyClip: PropertyClip)
        {
            if (propertyClip.cacheIndex && this._objectCache[propertyClip.cacheIndex])
                return this._objectCache[propertyClip.cacheIndex];

            if (!propertyClip.cacheIndex)
                propertyClip.cacheIndex = autoobjectCacheID++;

            var propertyHost: any = this.gameObject;
            var path = propertyClip.path;

            for (var i = 0; i < path.length; i++)
            {
                var element = path[i];
                switch (element[0])
                {
                    case PropertyClipPathItemType.GameObject:
                        propertyHost = propertyHost.find(element[1]);
                        break;
                    case PropertyClipPathItemType.Component:
                        var componentType = classUtils.getDefinitionByName(element[1]);
                        propertyHost = propertyHost.getComponent(componentType);
                        break;
                    default:
                        throw `无法获取 PropertyHost ${element}`;
                }
                if (propertyHost == null)
                    return null;
            }
            this._objectCache[propertyClip.cacheIndex] = propertyHost;
            return propertyHost;
        }

        private onAnimationChanged()
        {
            this.time = 0;
        }

        private onTimeChanged()
        {
            this.updateAni();
        }

        dispose()
        {
            this.animation = <any>null;
            this.animations = <any>null;
            super.dispose();
        }
    }
    var autoobjectCacheID = 1;

    export class AnimationClip
    {
        @serialize
        name: string;
        /**
         * 动画时长，单位ms
         */
        @serialize
        length: number;
        @serialize
        loop = true;
        @serialize
        propertyClips: PropertyClip[];
    }

    export class PropertyClip
    {
        /**
         * 属性路径
         */
        @serialize
        path: PropertyClipPath;

        @serialize
        propertyName: string;

        @serialize
        type: "Number" | "Vector3" | "Quaternion";

        @serialize
        propertyValues: [number, number[]][];

        private _fps = 24;
        private _cacheValues = {};
        private _propertyValues: [number, number | Vector3 | Quaternion][];

        getValue(cliptime: number)
        {
            var frame = Math.round(this._fps * cliptime / 1000);
            if (this._cacheValues[frame] != undefined)
                return this._cacheValues[frame];

            this._propertyValues = this._propertyValues || <any>this.propertyValues.map(v =>
            {
                return [v[0], this.getpropertyValue(v[1])];
            });
            var propertyValues = this._propertyValues;
            var propertyValue = propertyValues[0][1];
            if (cliptime <= propertyValues[0][0]) { }
            else if (cliptime >= propertyValues[propertyValues.length - 1][0])
                propertyValue = propertyValues[propertyValues.length - 1][1];
            else
            {
                for (var j = 0; j < propertyValues.length - 1; j++)
                {
                    if (propertyValues[j][0] <= cliptime && cliptime < propertyValues[j + 1][0])
                    {
                        propertyValue = this.interpolation(
                            propertyValues[j][1],
                            propertyValues[j + 1][1],
                            (cliptime - propertyValues[j][0]) / (propertyValues[j + 1][0] - propertyValues[j][0])
                        );
                        break;
                    }
                }
            }
            this._cacheValues[frame] = propertyValue;
            return propertyValue;
        }

        private interpolation(prevalue: ClipPropertyType, nextValue: ClipPropertyType, factor: number)
        {
            var propertyValue: ClipPropertyType;
            if (prevalue instanceof Quaternion)
            {
                propertyValue = prevalue.clone();
                propertyValue.lerp(prevalue, <Quaternion>nextValue, factor);
            } else if (prevalue instanceof Vector3)
            {
                propertyValue = new Vector3(
                    prevalue.x * (1 - factor) + (<Vector3>nextValue).x * factor,
                    prevalue.y * (1 - factor) + (<Vector3>nextValue).y * factor,
                    prevalue.z * (1 - factor) + (<Vector3>nextValue).z * factor,
                );
            } else
            {
                propertyValue = prevalue * (1 - factor) + <number>nextValue * factor;
            }
            return propertyValue;
        }

        private getpropertyValue(value: number[])
        {
            if (this.type == "Number")
                return value[0]
            if (this.type == "Vector3")
                return Vector3.fromArray(value);
            if (this.type == "Quaternion")
                return Quaternion.fromArray(value);

            error(`未处理 动画数据类型 ${this.type}`);
            throw ``;
        }

        cacheIndex: number;
    }

    /**
     * [time:number,value:number | Vector3 | Quaternion]
     */
    export type ClipPropertyType = number | Vector3 | Quaternion;
    export type PropertyClipPath = [PropertyClipPathItemType, string][];

    export enum PropertyClipPathItemType
    {
        GameObject,
        Component,
    }
}