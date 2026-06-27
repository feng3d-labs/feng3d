import { Attribute } from './Attribute';

/**
 * 顶点属性数据映射（属性名 → Attribute）。
 *
 * 原属 @feng3d/renderer，现迁移到 core 内部。
 */
export interface Attributes
{
    /** 位置。 */
    a_position: Attribute;
    /** 颜色。 */
    a_color: Attribute;
    /** 法线。 */
    a_normal: Attribute;
    /** 切线。 */
    a_tangent: Attribute;
    /** uv。 */
    a_uv: Attribute;
    /** 蒙皮关节索引。 */
    a_skinIndices: Attribute;
    /** 蒙皮关节权重。 */
    a_skinWeights: Attribute;
    /** 蒙皮关节索引1。 */
    a_skinIndices1: Attribute;
    /** 蒙皮关节权重1。 */
    a_skinWeights1: Attribute;

    /** 索引签名：允许任意属性名。 */
    [attributeName: string]: Attribute;
}
