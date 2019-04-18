namespace feng3d
{
    export interface GeometryMap { CustomGeometry: CustomGeometry }
    
    export class CustomGeometry extends Geometry
    {
        __class__: "feng3d.CustomGeometry" = "feng3d.CustomGeometry";
        
        /**
         * 顶点索引缓冲
         */
        @serialize
        get indicesBase()
        {
            return this._indices;
        }
        set indicesBase(value)
        {
            this.indices = value;
        }

        /**
         * 属性数据列表
         */
        @serialize
        get attributes()
        {
            return this._attributes;
        }
        set attributes(value)
        {
            this._attributes = {};
            for (var key in value)
            {
                this.setVAData(<any>key, value[key].data, value[key].size);
            }
        }
    }
}