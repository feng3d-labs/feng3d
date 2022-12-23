import { Quaternion } from "../../math/geom/Quaternion";
import { Vector3 } from "../../math/geom/Vector3";
import { SerializeProperty } from "../../serialization/SerializeProperty";

export class PropertyClip
{
    /**
     * 属性路径
     */
    @SerializeProperty
    path: PropertyClipPath;

    @SerializeProperty
    propertyName: string;

    @SerializeProperty
    type: 'Number' | 'Vector3' | 'Quaternion';

    @SerializeProperty
    times: number[];

    @SerializeProperty
    values: number[];

    getValue(cliptime: number)
    {
        const times = this.times;
        let propertyValue: number | Vector3 | Quaternion;
        if (cliptime <= times[0])
        {
            propertyValue = this.getpropertyValue(0);
        }
        else if (cliptime >= times[times.length - 1])
        {
            propertyValue = this.getpropertyValue(times.length - 1);
        }
        else
        {
            for (let j = 0; j < times.length - 1; j++)
            {
                if (times[j] <= cliptime && cliptime < times[j + 1])
                {
                    propertyValue = this.interpolation(
                        this.getpropertyValue(j),
                        this.getpropertyValue(j + 1),
                        (cliptime - times[j]) / (times[j + 1] - times[j])
                    );
                    break;
                }
            }
        }

        return propertyValue;
    }

    private interpolation(prevalue: ClipPropertyType, nextValue: ClipPropertyType, factor: number)
    {
        let propertyValue: ClipPropertyType;
        if (prevalue instanceof Quaternion)
        {
            propertyValue = prevalue.clone();
            propertyValue.lerp(prevalue, <Quaternion>nextValue, factor);
        }
        else if (prevalue instanceof Vector3)
        {
            propertyValue = new Vector3(
                prevalue.x * (1 - factor) + (<Vector3>nextValue).x * factor,
                prevalue.y * (1 - factor) + (<Vector3>nextValue).y * factor,
                prevalue.z * (1 - factor) + (<Vector3>nextValue).z * factor,
            );
        }
        else
        {
            propertyValue = prevalue * (1 - factor) + <number>nextValue * factor;
        }

        return propertyValue;
    }

    private getpropertyValue(index: number)
    {
        const values = this.values;
        if (this.type === 'Number')
        {
            return values[index];
        }
        if (this.type === 'Vector3')
        {
            return new Vector3().fromArray(values, index * 3);
        }
        if (this.type === 'Quaternion')
        {
            return new Quaternion().fromArray(values, index * 4);
        }

        console.error(`未处理 动画数据类型 ${this.type}`);
        console.error(``);
    }
}

/**
 * [time:number,value:number | Vector3 | Quaternion]
 */
export type ClipPropertyType = number | Vector3 | Quaternion;
export type PropertyClipPath = [PropertyClipPathItemType, string][];

export enum PropertyClipPathItemType
{
    Object3D,
    Component,
}
