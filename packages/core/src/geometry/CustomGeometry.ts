import { AttributeBuffer, ElementBuffer } from '@feng3d/renderer';
import { decoratorRegisterClass, serialize } from '@feng3d/serialization';
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
    declare indexBuffer: ElementBuffer;

    /**
     * 属性数据列表
     */
    @serialize
    declare attributes: { [key: string]: AttributeBuffer; };
}
