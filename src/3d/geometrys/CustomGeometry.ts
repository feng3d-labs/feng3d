import { AttributeBuffer } from '../../renderer/data/AttributeBuffer';
import { ElementBuffer } from '../../renderer/data/ElementBuffer';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Geometry, RegisterGeometry } from './Geometry';

declare module './Geometry' { interface GeometryMap { CustomGeometry: CustomGeometry } }

@RegisterGeometry('CustomGeometry')
export class CustomGeometry extends Geometry
{
    declare __class__: 'CustomGeometry';

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
