import { Quaternion, quatFromArray, quatLerp, Vector3, Vector3Like, vec3FromArray } from '@feng3d/math';

export class PropertyClip
{
    /**
     * 属性路径
     */
    path: PropertyClipPath;

    propertyName: string;

    type: 'Number' | 'Vector3' | 'Quaternion';

    times: number[];

    values: number[];

    getValue(cliptime: number)
    {
        const times = this.times;
        // 可能全部分支都没赋值（times 为空或区间不匹配），显式允许 undefined
        let propertyValue: number | Vector3 | Quaternion | undefined;
        if (cliptime <= times[0])
        {
            propertyValue = this.getpropertyValue(0)!;
        }
        else if (cliptime >= times[times.length - 1])
        {
            propertyValue = this.getpropertyValue(times.length - 1)!;
        }
        else
        {
            for (let j = 0; j < times.length - 1; j++)
            {
                if (times[j] <= cliptime && cliptime < times[j + 1])
                {
                    propertyValue = this.interpolation(
                        this.getpropertyValue(j)!,
                        this.getpropertyValue(j + 1)!,
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
        // 阶段 C-e：`Quaternion` 的 class 已删除，`instanceof` 判别改成结构化判别（`w` 分量），
        // 语义等价——`Vector3` 没有 `w`，`number` 也不是对象。
        if (typeof prevalue === 'object' && 'w' in prevalue)
        {
            propertyValue = { __type__: 'Quaternion', ...quatLerp(prevalue, nextValue as Quaternion, factor) };
        }
        else if (typeof prevalue === 'object' && 'x' in prevalue)
        {
            // 阶段 C-f：`Vector3` 的 class 已删除，`instanceof` 改成结构化判别（有 `x` 分量）；
            // 装配点显式补判别字段（纯函数层不产 `__type__`）
            const p = prevalue as Vector3Like;
            const n = nextValue as Vector3Like;

            propertyValue = { __type__: 'Vector3', x: p.x * (1 - factor) + n.x * factor, y: p.y * (1 - factor) + n.y * factor, z: p.z * (1 - factor) + n.z * factor };
        }
        else
        {
            propertyValue = (prevalue as number) * (1 - factor) + <number>nextValue * factor;
        }

        return propertyValue;
    }

    private getpropertyValue(index: number): ClipPropertyType | undefined
    {
        const values = this.values;
        if (this.type === 'Number')
        {
            return values[index];
        }
        if (this.type === 'Vector3')
        {
            return { __type__: 'Vector3', ...vec3FromArray(values, index * 3) };
        }
        if (this.type === 'Quaternion')
        {
            // 装配点显式补判别字段（纯函数缺省 out 是不带 `__type__` 的字面量）
            const quaternion: Quaternion = { __type__: 'Quaternion', ...quatFromArray(values, index * 4) };

            return quaternion;
        }

        console.error(`未处理 动画数据类型 ${this.type}`);
        console.error(``);

        return undefined;
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
