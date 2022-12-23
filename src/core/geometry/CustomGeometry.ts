import { AttributeBuffer } from '../../renderer/data/AttributeBuffer';
import { ElementBuffer } from '../../renderer/data/ElementBuffer';
import { Serializable } from '../../serialization/Serializable';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Geometry } from './Geometry';

declare global
{
    export interface MixinsGeometryMap
    {
        CustomGeometry: CustomGeometry
    }
}

@Serializable()
export class CustomGeometry extends Geometry
{
    __class__: 'CustomGeometry';

    /**
     * 顶点索引缓冲
     */
    @SerializeProperty()
    declare indexBuffer: ElementBuffer;

    /**
     * 属性数据列表
     */
    @SerializeProperty()
    declare attributes: { [key: string]: AttributeBuffer; };
}
