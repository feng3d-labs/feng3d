import { decoratorRegisterClass } from '../../polyfill/ClassUtils';
import { serialize } from '../../serialization/Serialization';
import { Geometry } from './Geometry';

declare global
{
    export interface MixinsGeometryTypes
    {
        CustomGeometry: CustomGeometry
    }
}

@decoratorRegisterClass()
export class CustomGeometry extends Geometry
{
    __class__: 'CustomGeometry';

    /**
     * 顶点索引缓冲
     */
    @serialize
    private get indicesData()
    {
        return this.indices;
    }

    private set indicesData(v)
    {
        this.indices = v;
    }

    /**
     * 属性数据列表
     */
    @serialize
    get attributes()
    {
        return this._attributes;
    }
    set attributes(v)
    {
        this._attributes = v;
    }
}
