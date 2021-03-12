namespace feng3d
{

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

        private _cacheValues = {};
        private _propertyValues: [number, number | Vector3 | Quaternion][];

        getValue(cliptime: number, fps: number)
        {
            var frame = Math.round(fps * cliptime / 1000);
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

            console.error(`未处理 动画数据类型 ${this.type}`);
            console.error(``);
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
        Entity,
        Component,
    }
}