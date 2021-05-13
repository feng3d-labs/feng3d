import { Attributes } from "../renderer/data/Attributes";
import { serialize } from "@feng3d/serialization";
import { Geometry } from "./Geometry";

export interface GeometryTypes { CustomGeometry: CustomGeometry }

export class CustomGeometry extends Geometry
{
    __class__: "feng3d.CustomGeometry";

    /**
     * 顶点索引缓冲
     */
    @serialize
    get indices()
    {
        this.updateGrometry();
        return this._indexBuffer.indices;
    }

    /**
     * 属性数据列表
     */
    @serialize
    get attributes(): Attributes
    {
        return this._attributes;
    }
    set attributes(v)
    {
        this._attributes = v;
    }
}
