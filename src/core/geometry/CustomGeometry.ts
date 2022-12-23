import { AttributeBuffer } from '../../renderer/data/AttributeBuffer';
import { ElementBuffer } from '../../renderer/data/ElementBuffer';
import { decoratorRegisterClass } from '../../serialization/ClassUtils';
import { serialize } from '../../serialization/serialize';
import { Geometry } from './Geometry';

declare global
{
    export interface MixinsGeometryMap
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
    declare indexBuffer: ElementBuffer;

    /**
     * 属性数据列表
     */
    @serialize
    declare attributes: { [key: string]: AttributeBuffer; };
}
